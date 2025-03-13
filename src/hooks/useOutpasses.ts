
import { useState, useEffect, useCallback } from 'react';
import { Outpass, Student, Mentor, UserRole } from '@/lib/types';
import storageSync from '@/lib/storageSync';
import { toast } from 'sonner';

/**
 * Custom hook for real-time outpass data
 * This hook will automatically update when outpasses are modified in any tab
 */
export function useOutpasses() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Student | Mentor | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [tabId, setTabId] = useState<string>('');

  // Load initial data and subscribe to changes
  useEffect(() => {
    setIsLoading(true);
    setTabId(storageSync.getTabId());
    
    // Subscribe to outpass changes (both from this tab and other tabs)
    const unsubscribe = storageSync.subscribe('outpasses', (newOutpasses) => {
      if (Array.isArray(newOutpasses)) {
        setOutpasses(newOutpasses);
      } else {
        // Initialize if not found or invalid
        const emptyArray: Outpass[] = [];
        storageSync.setItem('outpasses', emptyArray);
        setOutpasses(emptyArray);
      }
      setIsLoading(false);
    });
    
    // Get session-specific user data
    const userData = storageSync.getUser();
    const userRoleData = storageSync.getUserRole() as UserRole | null;
    
    setCurrentUser(userData);
    setUserRole(userRoleData);
    
    // Set up broadcast channel for user changes if available
    let userChangeChannel: BroadcastChannel | null = null;
    
    if (typeof BroadcastChannel !== 'undefined') {
      userChangeChannel = new BroadcastChannel('amipass_user_changed');
      userChangeChannel.onmessage = () => {
        // Just refresh our outpasses, don't change user session
        const outpassesData = storageSync.getItem<Outpass[]>('outpasses');
        if (outpassesData) {
          setOutpasses(outpassesData);
        }
      };
    }
    
    return () => {
      unsubscribe();
      if (userChangeChannel) {
        userChangeChannel.close();
      }
    };
  }, []);

  // Get filtered outpasses based on user role
  const filteredOutpasses = outpasses.filter(outpass => {
    if (!currentUser) return false;
    
    if (userRole === 'student') {
      return outpass.studentId === currentUser.id;
    } else if (userRole === 'mentor') {
      const mentor = currentUser as Mentor;
      // Show outpasses for sections that the mentor manages
      return outpass.studentSection && mentor.sections.includes(outpass.studentSection);
    }
    
    return false;
  });

  // Function to update outpasses with real-time syncing
  const updateOutpass = useCallback((updatedOutpass: Outpass) => {
    const updatedOutpasses = outpasses.map(outpass => 
      outpass.id === updatedOutpass.id ? updatedOutpass : outpass
    );
    
    // Update timestamp
    updatedOutpass.updatedAt = new Date().toISOString();
    
    storageSync.setItem('outpasses', updatedOutpasses);
    
    // Show toast for real-time feedback with tab ID
    const toastMessage = `[Tab: ${tabId.substring(0, 5)}] `;
    
    if (userRole === 'mentor' && updatedOutpass.status === 'approved') {
      toast.success(`${toastMessage}Outpass for ${updatedOutpass.studentName} approved`);
    } else if (userRole === 'mentor' && updatedOutpass.status === 'denied') {
      toast.error(`${toastMessage}Outpass for ${updatedOutpass.studentName} denied`);
    } else if (userRole === 'student' && updatedOutpass.status === 'approved') {
      toast.success(`${toastMessage}Your outpass has been approved!`);
    } else if (userRole === 'student' && updatedOutpass.status === 'denied') {
      toast.error(`${toastMessage}Your outpass was denied: ${updatedOutpass.denyReason}`);
    }
  }, [outpasses, userRole, tabId]);

  // Function to add a new outpass with real-time syncing
  const addOutpass = useCallback((newOutpass: Outpass) => {
    const updatedOutpasses = [...outpasses, newOutpass];
    storageSync.setItem('outpasses', updatedOutpasses);
    
    // Show toast for real-time feedback
    if (userRole === 'student') {
      toast.success(`[Tab: ${tabId.substring(0, 5)}] Outpass request submitted successfully`);
    }
  }, [outpasses, userRole, tabId]);

  // Function to delete an outpass with real-time syncing
  const deleteOutpass = useCallback((outpassId: string) => {
    const updatedOutpasses = outpasses.filter(outpass => outpass.id !== outpassId);
    storageSync.setItem('outpasses', updatedOutpasses);
    
    toast.success(`[Tab: ${tabId.substring(0, 5)}] Outpass deleted successfully`);
  }, [outpasses, tabId]);

  return {
    outpasses: filteredOutpasses,
    allOutpasses: outpasses, // For admin purposes if needed
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass,
    tabId
  };
}
