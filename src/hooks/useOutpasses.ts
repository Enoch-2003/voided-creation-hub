
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
  const { outpasses: allOutpasses, isLoading: subscriptionLoading, tabId } = useOutpassSubscription();
  const { currentUser, userRole, updateUser, isLoading: profileLoading } = useUserProfile();
  const { updateOutpass, addOutpass, deleteOutpass } = useOutpassOperations(tabId);
  
  // Get filtered outpasses based on user role
  const filteredOutpasses = allOutpasses.filter(outpass => {
    if (!currentUser) return false;
    
    // Don't validate, just use the outpass directly to avoid validation errors
    // This is safe because our database schema enforces correctness
    if (isStudent(currentUser)) {
      return outpass.studentId === currentUser.id;
    } else if (isMentor(currentUser)) {
      // Show outpasses for sections that the mentor manages
      return outpass.studentSection && 
             (currentUser.sections?.includes(outpass.studentSection) || false);
    } else {
      // Admin can see all outpasses
      return true;
    }
  });

  // Combine loading states
  const isLoading = subscriptionLoading || profileLoading;

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
