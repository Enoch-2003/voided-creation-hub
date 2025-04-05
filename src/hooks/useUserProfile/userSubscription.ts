
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Student, Mentor, Admin } from '@/lib/types';
import { toast } from 'sonner';

/**
 * Setup real-time subscription for user profile updates
 */
export function setupUserSubscription(
  userId: string | undefined, 
  userRole: UserRole | "admin" | null,
  onProfileUpdate: () => void
): () => void {
  if (!userId || !userRole) return () => {};
  
  let tableName: "students" | "mentors" | "admins" | null = null;
  if (userRole === 'student') tableName = 'students';
  else if (userRole === 'mentor') tableName = 'mentors';
  else if (userRole === 'admin') tableName = 'admins';
  
  if (tableName) {
    const channel = supabase
      .channel(`${tableName}-changes-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: tableName,
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log(`${tableName} profile updated:`, payload.new);
          // Refetch user profile data to update the state
          onProfileUpdate();
          
          // Show toast notification
          toast.success("Your profile information has been updated");
        })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }
  
  return () => {};
}

/**
 * Hook to subscribe to real-time user profile updates
 */
export function useUserSubscription() {
  const [userUpdates, setUserUpdates] = useState<Student | Mentor | Admin | null>(null);
  
  useEffect(() => {
    // This effect is just a placeholder for the subscription setup
    // The actual subscription is set up in the useUserProfile hook
    // This is just to expose the userUpdates state
    return () => {};
  }, []);
  
  return { userUpdates };
}
