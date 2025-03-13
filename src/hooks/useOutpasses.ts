
import { useState, useEffect } from 'react';
import { Outpass, Student, Mentor, UserRole } from '@/lib/types';
import storageSync from '@/lib/storageSync';

/**
 * Custom hook for real-time outpass data
 * This hook will automatically update when outpasses are modified in any tab
 */
export function useOutpasses() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Student | Mentor | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // Get current user info
    const user = storageSync.getItem<Student | Mentor>('user');
    const role = storageSync.getItem<UserRole>('userRole');
    
    setCurrentUser(user);
    setUserRole(role);

    // Initial load
    const loadOutpasses = () => {
      const storedOutpasses = localStorage.getItem('outpasses');
      if (storedOutpasses) {
        try {
          const parsedOutpasses = JSON.parse(storedOutpasses);
          setOutpasses(parsedOutpasses);
        } catch (error) {
          console.error('Error parsing outpasses:', error);
          setOutpasses([]);
        }
      } else {
        // Initialize empty array if none exists
        localStorage.setItem('outpasses', JSON.stringify([]));
        setOutpasses([]);
      }
      setIsLoading(false);
    };

    loadOutpasses();

    // Subscribe to outpass changes in other tabs
    const unsubscribe = storageSync.subscribe('outpasses', (newOutpasses) => {
      if (newOutpasses) {
        setOutpasses(newOutpasses);
      } else {
        setOutpasses([]);
      }
    });
    
    // Subscribe to user changes
    const userUnsubscribe = storageSync.subscribe('user', (userData) => {
      setCurrentUser(userData);
    });
    
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

  // Function to update outpasses
  const updateOutpass = (updatedOutpass: Outpass) => {
    const updatedOutpasses = outpasses.map(outpass => 
      outpass.id === updatedOutpass.id ? updatedOutpass : outpass
    );
    
    storageSync.setItem('outpasses', updatedOutpasses);
  };

  // Function to add a new outpass
  const addOutpass = (newOutpass: Outpass) => {
    const updatedOutpasses = [...outpasses, newOutpass];
    storageSync.setItem('outpasses', updatedOutpasses);
  };

  // Function to delete an outpass
  const deleteOutpass = (outpassId: string) => {
    const updatedOutpasses = outpasses.filter(outpass => outpass.id !== outpassId);
    storageSync.setItem('outpasses', updatedOutpasses);
  };

  return {
    outpasses: filteredOutpasses,
    allOutpasses: outpasses, // For admin purposes if needed
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass
  };
}
