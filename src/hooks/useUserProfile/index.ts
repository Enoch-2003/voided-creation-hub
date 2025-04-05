
import { useState, useEffect } from 'react';
import { Student, Mentor, Admin, UserRole } from '@/lib/types';
import { fetchUserProfileData } from './fetchUserProfile';
import { updateUserProfile } from './updateUser';
import { useUserSubscription } from './userSubscription';

/**
 * Custom hook for user profile management
 */
export function useUserProfile() {
  const [currentUser, setCurrentUser] = useState<Student | Mentor | Admin | null>(null);
  const [userRole, setUserRole] = useState<UserRole | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Use the subscription hook for real-time updates
  const { userUpdates } = useUserSubscription();
  
  // Set initial user data from session storage
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user") 
      ? JSON.parse(sessionStorage.getItem("user") as string) 
      : null;
    const storedUserRole = sessionStorage.getItem("userRole") as UserRole | 'admin' | null;
    
    if (storedUser && storedUserRole) {
      setCurrentUser(storedUser);
      setUserRole(storedUserRole);
    }
    
    setIsLoading(false);
  }, []);
  
  // Update user state if real-time update is received
  useEffect(() => {
    if (userUpdates && currentUser && userUpdates.id === currentUser.id) {
      console.log('User profile updated via real-time subscription', userUpdates);
      setCurrentUser(userUpdates);
      
      // Also update session storage
      sessionStorage.setItem("user", JSON.stringify(userUpdates));
    }
  }, [userUpdates, currentUser]);
  
  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    if (!currentUser || !userRole) return null;
    
    setIsLoading(true);
    try {
      const data = await fetchUserProfileData(currentUser, userRole);
      if (data) {
        setCurrentUser(data);
        sessionStorage.setItem("user", JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update user profile
  const updateUser = async (updatedUser: Student | Mentor | Admin) => {
    if (!currentUser) return null;
    
    setIsLoading(true);
    try {
      const data = await updateUserProfile(updatedUser, currentUser, userRole);
      if (data) {
        setCurrentUser(data);
        sessionStorage.setItem("user", JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    currentUser,
    userRole,
    isLoading,
    fetchUserProfile,
    updateUser
  };
}
