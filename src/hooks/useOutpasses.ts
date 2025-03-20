
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
  const [currentUser, setCurrentUser] = useState<Student | Mentor | any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | "admin" | null>(null);
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
    
    // Subscribe to users changes to get updated user data
    const userUnsubscribe = storageSync.subscribe('users', () => {
      // Get the latest user data for the current user from the users array
      const users = storageSync.getItem<any[]>('users') || [];
      const currentSessionUser = storageSync.getUser();
      
      if (currentSessionUser && currentSessionUser.id) {
        const updatedUser = users.find(u => u.id === currentSessionUser.id);
        if (updatedUser) {
          // Update session storage and state with the latest user data
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
          // Show notification if run from student dashboard
          if (userRole === 'student') {
            toast.info("Your profile information has been updated by an administrator");
          }
        }
      }
    });
    
    // Get session-specific user data
    const userData = storageSync.getUser();
    const userRoleData = storageSync.getUserRole() as UserRole | "admin" | null;
    
    setCurrentUser(userData);
    setUserRole(userRoleData);
    
    // Set up broadcast channel for user changes if available
    let userChangeChannel: BroadcastChannel | null = null;
    
    if (typeof BroadcastChannel !== 'undefined') {
      userChangeChannel = new BroadcastChannel('amipass_user_changed');
      userChangeChannel.onmessage = (event) => {
        // Just refresh our outpasses, don't change user session
        const outpassesData = storageSync.getItem<Outpass[]>('outpasses');
        if (outpassesData) {
          setOutpasses(outpassesData);
        }
        
        // If the event contains updated user data for this tab's user, update it
        if (event.data && event.data.userId) {
          const currentTabUser = storageSync.getUser();
          if (currentTabUser && currentTabUser.id === event.data.userId) {
            // Get the latest user data from the updated users array
            const users = storageSync.getItem<any[]>('users') || [];
            const updatedUser = users.find(u => u.id === event.data.userId);
            
            if (updatedUser) {
              // Update session storage with the latest user data
              sessionStorage.setItem('user', JSON.stringify(updatedUser));
              setCurrentUser(updatedUser);
              
              // Force synchronize the state with the updated user data
              if (event.data.forceUpdate) {
                // Show notification if run from student dashboard
                if (userRole === 'student') {
                  toast.info("Your profile information has been updated by an administrator", {
                    description: "Reload the page if you don't see the changes"
                  });
                }
              }
            }
          }
        }
      };
    }
    
    // Monitor for changes to the current user data
    const checkUserChanges = () => {
      if (!currentUser || !currentUser.id) return;
      
      // Check for updates in the users array
      const users = storageSync.getItem<any[]>('users') || [];
      const latestUserData = users.find(u => u.id === currentUser.id);
      
      if (latestUserData && JSON.stringify(latestUserData) !== JSON.stringify(currentUser)) {
        // Update session storage with the latest user data
        sessionStorage.setItem('user', JSON.stringify(latestUserData));
        setCurrentUser(latestUserData);
        
        // Show notification if run from student dashboard
        if (userRole === 'student') {
          toast.info("Your profile information has been updated by an administrator");
        }
      }
    };
    
    // Check for user changes more frequently (every 500ms)
    const userCheckInterval = setInterval(checkUserChanges, 500);
    
    return () => {
      unsubscribe();
      userUnsubscribe();
      if (userChangeChannel) {
        userChangeChannel.close();
      }
      clearInterval(userCheckInterval);
    };
  }, [userRole]);

  // Get filtered outpasses based on user role
  const filteredOutpasses = outpasses.filter(outpass => {
    if (!currentUser) return false;
    
    if (userRole === 'student') {
      return outpass.studentId === currentUser.id;
    } else if (userRole === 'mentor') {
      const mentor = currentUser as Mentor;
      // Show outpasses for sections that the mentor manages
      return outpass.studentSection && mentor.sections.includes(outpass.studentSection);
    } else if (userRole === 'admin') {
      // Admin can see all outpasses
      return true;
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

  // Function to update the user
  const updateUser = useCallback((updatedUser: Student | Mentor | any) => {
    // Set local state
    setCurrentUser(updatedUser);
    
    // Update users array in localStorage
    const users = storageSync.getItem<any[]>('users') || [];
    const existingUserIndex = users.findIndex(user => user.id === updatedUser.id);
    
    let updatedUsers;
    if (existingUserIndex >= 0) {
      // Update existing user
      updatedUsers = [...users];
      updatedUsers[existingUserIndex] = updatedUser;
    } else {
      // Add user if not found
      updatedUsers = [...users, updatedUser];
    }
    
    // Update localStorage with the updated users array
    storageSync.setItem('users', updatedUsers);
    
    // Update session storage for this tab
    if (updatedUser.id === storageSync.getUser()?.id) {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    // Notify other tabs about the user update via broadcast channel
    if (typeof BroadcastChannel !== 'undefined') {
      const userChangeChannel = new BroadcastChannel('amipass_user_changed');
      userChangeChannel.postMessage({ userId: updatedUser.id, forceUpdate: true });
      userChangeChannel.close();
    }
    
    return updatedUser;
  }, []);

  return {
    outpasses: filteredOutpasses,
    allOutpasses: outpasses, // For admin purposes if needed
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass,
    tabId,
    currentUser,
    updateUser
  };
}
