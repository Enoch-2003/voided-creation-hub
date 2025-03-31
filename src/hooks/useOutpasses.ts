
import { useState, useEffect } from 'react';
import { Outpass, Student, Mentor } from '@/lib/types';
import { useOutpassSubscription } from './useOutpassSubscription';
import { useUserProfile } from './useUserProfile';
import { useOutpassOperations } from './useOutpassOperations';

/**
 * Main hook that combines subscription, user profile, and operations
 * to provide a unified interface for outpass functionality
 */
export function useOutpasses() {
  const { outpasses: allOutpasses, isLoading, tabId } = useOutpassSubscription();
  const { currentUser, userRole, updateUser } = useUserProfile();
  const { updateOutpass, addOutpass, deleteOutpass } = useOutpassOperations(tabId);
  
  // Get filtered outpasses based on user role
  const filteredOutpasses = allOutpasses.filter(outpass => {
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

  return {
    outpasses: filteredOutpasses,
    allOutpasses, // For admin purposes if needed
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass,
    tabId,
    currentUser,
    updateUser
  };
}
