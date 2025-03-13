
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

  // Load initial data and subscribe to changes
  useEffect(() => {
    setIsLoading(true);
    
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
    
    // Subscribe to user changes
    const userUnsubscribe = storageSync.subscribe('user', (userData) => {
      setCurrentUser(userData);
    });
    
    // Subscribe to user role changes
    const roleUnsubscribe = storageSync.subscribe('userRole', (role) => {
      setUserRole(role as UserRole);
    });

    return () => {
      unsubscribe();
      userUnsubscribe();
      roleUnsubscribe();
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
    
    storageSync.setItem('outpasses', updatedOutpasses);
    
    // Show toast for real-time feedback
    if (userRole === 'mentor' && updatedOutpass.status === 'approved') {
      toast.success(`Outpass for ${updatedOutpass.studentName} approved`);
    } else if (userRole === 'mentor' && updatedOutpass.status === 'denied') {
      toast.error(`Outpass for ${updatedOutpass.studentName} denied`);
    } else if (userRole === 'student' && updatedOutpass.status === 'approved') {
      toast.success(`Your outpass has been approved!`);
    } else if (userRole === 'student' && updatedOutpass.status === 'denied') {
      toast.error(`Your outpass was denied: ${updatedOutpass.denyReason}`);
    }
  }, [outpasses, userRole]);

  // Function to add a new outpass with real-time syncing
  const addOutpass = useCallback((newOutpass: Outpass) => {
    const updatedOutpasses = [...outpasses, newOutpass];
    storageSync.setItem('outpasses', updatedOutpasses);
    
    // Show toast for real-time feedback
    if (userRole === 'student') {
      toast.success('Outpass request submitted successfully');
    }
  }, [outpasses, userRole]);

  // Function to delete an outpass with real-time syncing
  const deleteOutpass = useCallback((outpassId: string) => {
    const updatedOutpasses = outpasses.filter(outpass => outpass.id !== outpassId);
    storageSync.setItem('outpasses', updatedOutpasses);
    
    toast.success('Outpass deleted successfully');
  }, [outpasses]);

  return {
    outpasses: filteredOutpasses,
    allOutpasses: outpasses, // For admin purposes if needed
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass
  };
}
