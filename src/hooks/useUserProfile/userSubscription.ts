
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, Student, Mentor, Admin } from '@/lib/types';
import { toast } from 'sonner';
import storageSync from '@/lib/storageSync';

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
    console.log(`Setting up real-time subscription for ${tableName} with ID ${userId}`);
    
    // Save userId to sessionStorage for cross-tab notifications
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('userRole', userRole);
    
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
          
          // Store the userId in sessionStorage for real-time notifications
          sessionStorage.setItem('userId', userId);
          sessionStorage.setItem('userRole', userRole);
          
          // Refetch user profile data to update the state
          onProfileUpdate();
          
          // Update user in localStorage for cross-tab communication
          const users = storageSync.getItem<any[]>('users') || [];
          const userIndex = users.findIndex(u => u.id === userId);
          
          if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...payload.new };
          } else {
            users.push(payload.new);
          }
          
          storageSync.setItem('users', users);
          
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
    // Register a BroadcastChannel listener for user updates across tabs
    let broadcastChannel: BroadcastChannel | null = null;
    
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('amipass_user_changed');
        
        broadcastChannel.onmessage = (event) => {
          if (!event.data || !event.data.userId) return;
          
          const userId = sessionStorage.getItem('userId');
          if (userId === event.data.userId) {
            // This update is for the current user, trigger a refresh
            const users = storageSync.getItem<any[]>('users') || [];
            const updatedUser = users.find(u => u.id === userId);
            
            if (updatedUser) {
              setUserUpdates(updatedUser);
            }
          }
        };
      } catch (error) {
        console.error("Error setting up user subscription broadcast channel:", error);
      }
    }
    
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, []);
  
  return { userUpdates, setUserUpdates };
}
