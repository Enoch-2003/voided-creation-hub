
import { useState, useEffect } from 'react';
import { Outpass, Student, Mentor, User, isStudent, isMentor } from '@/lib/types';
import { useOutpassSubscription } from './useOutpassSubscription';
import { useUserProfile } from './useUserProfile';
import { useOutpassOperations } from './useOutpassOperations';
import { validateOutpass } from '@/lib/validation';
import { handleApiError } from '@/lib/errorHandler';

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
    
    // Validate each outpass to ensure type safety
    const validatedOutpass = validateOutpass(outpass);
    if (!validatedOutpass) return false;
    
    if (isStudent(currentUser)) {
      return validatedOutpass.studentId === currentUser.id;
    } else if (isMentor(currentUser)) {
      // Show outpasses for sections that the mentor manages
      return validatedOutpass.studentSection && 
             currentUser.sections?.includes(validatedOutpass.studentSection);
    } else {
      // Admin can see all outpasses
      return true;
    }
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
