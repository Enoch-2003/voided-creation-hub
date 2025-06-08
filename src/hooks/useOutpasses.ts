import { useState, useEffect } from 'react';
import { Outpass, Student, Mentor, User, isStudent, isMentor } from '@/lib/types';
import { useOutpassSubscription } from './useOutpassSubscription';
import { useUserProfile } from './useUserProfile';
import { useOutpassOperations } from './useOutpassOperations';

/**
 * Main hook that combines subscription, user profile, and operations
 * to provide a unified interface for outpass functionality
 */
export function useOutpasses() {
  const { outpasses: allOutpasses, isLoading: subscriptionLoading, tabId } = useOutpassSubscription();
  const { currentUser, userRole, updateUser, isLoading: profileLoading } = useUserProfile();
  const { updateOutpass, addOutpass, deleteOutpass } = useOutpassOperations(tabId);
  
  // Get filtered outpasses based on user role with deduplication
  const filteredOutpasses = allOutpasses.filter((outpass, index, array) => {
    if (!currentUser) return false;
    
    // Remove duplicates first - keep only the first occurrence of each ID
    const firstOccurrenceIndex = array.findIndex(o => o.id === outpass.id);
    if (firstOccurrenceIndex !== index) {
      console.log("Removing duplicate outpass:", outpass.id);
      return false;
    }
    
    // Apply user role-based filtering
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
