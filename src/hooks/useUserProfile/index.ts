
import { useState, useEffect, useCallback } from 'react';
import { Student, Mentor, Admin, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { setupUserSubscription } from './userSubscription';
import { updateUserProfile } from './updateUser';
import { fetchUserProfileData } from './fetchUserProfile';

/**
 * Custom hook for managing user profile data
 */
export function useUserProfile() {
  const [currentUser, setCurrentUser] = useState<Student | Mentor | Admin | null>(null);
  const [userRole, setUserRole] = useState<UserRole | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from session storage
  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    const userRoleData = sessionStorage.getItem('userRole') as UserRole | "admin" | null;
    
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    
    if (userRoleData) {
      setUserRole(userRoleData);
    }
    
    setIsLoading(false);
  }, []);

  // If user role changes, update profile data from database
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const userData = await fetchUserProfileData(currentUser, userRole);
      
      if (userData) {
        // Update session storage
        sessionStorage.setItem('user', JSON.stringify(userData));
        setCurrentUser(userData);
      }
      
      setIsLoading(false);
    };
    
    if (currentUser?.id && userRole) {
      fetchProfile();
      
      // Set up real-time subscription for profile updates
      return setupUserSubscription(
        currentUser.id, 
        userRole, 
        fetchProfile
      );
    }
  }, [currentUser?.id, userRole]);

  // Function to update the user
  const updateUser = useCallback(async (updatedUser: Student | Mentor | Admin) => {
    try {
      const updatedUserData = await updateUserProfile(updatedUser, currentUser, userRole);
      
      // Update session storage and state if this is the current user
      if (updatedUser.id === currentUser?.id) {
        sessionStorage.setItem('user', JSON.stringify(updatedUserData));
        setCurrentUser(updatedUserData);
      }
      
      // Show toast notification for user updates
      if (userRole === 'student' && updatedUser.id === currentUser?.id) {
        toast.info("Your profile information has been updated");
      } else {
        toast.info(`User ${updatedUser.name} has been updated`);
      }
      
      return updatedUserData;
    } catch (error) {
      throw error;
    }
  }, [currentUser, userRole]);

  return { 
    currentUser, 
    userRole,
    isLoading, 
    updateUser 
  };
}
