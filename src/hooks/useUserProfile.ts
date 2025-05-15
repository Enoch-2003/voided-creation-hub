
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student, Mentor, Admin, UserRole } from '@/lib/types'; // Assuming User is part of general types or defined here
import { fetchUserProfileData } from './useUserProfile/fetchUserProfile';
import { updateUserProfile as updateUserProfileService } from './useUserProfile/updateUser';
// import { subscribeToUserProfileChanges, unsubscribeFromUserProfileChanges } from './useUserProfile/userSubscription'; // Uncomment if needed
import { toast } from 'sonner';

// Define a base User type if not already available globally, Supabase user has 'id' and 'user_metadata'
interface User {
  id: string;
  email?: string;
  user_metadata: {
    role?: UserRole | "admin";
    [key: string]: any;
  };
  // Add other common user properties if needed
}


export const useUserProfile = () => {
  const [currentUserProfile, setCurrentUserProfile] = useState<Student | Mentor | Admin | null>(null);
  const [userRole, setUserRole] = useState<UserRole | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);


  const fetchUserAndProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        const supabaseUser = session.user as User;
        setSessionUser(supabaseUser);
        const role = supabaseUser.user_metadata?.role || null;
        setUserRole(role);

        if (role) {
          const profileData = await fetchUserProfileData(supabaseUser as any, role); // Cast supabaseUser as needed by fetchUserProfileData
          setCurrentUserProfile(profileData);
        } else {
          setCurrentUserProfile(null);
          toast.error("User role not found in session metadata.");
        }
      } else {
        setSessionUser(null);
        setUserRole(null);
        setCurrentUserProfile(null);
      }
    } catch (e: any) {
      console.error('Error fetching user and profile:', e);
      setError(e.message || 'Failed to fetch user profile');
      toast.error(e.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      await fetchUserAndProfile(); // Refetch on auth changes
    });

    // Setup subscription to profile changes if needed, via userSubscription.ts
    // This would require subscribeToUserProfileChanges to be implemented and currentUserProfile to have an ID
    // let unsubscribe: (() => void) | null = null;
    // if (currentUserProfile?.id && userRole) {
    //   unsubscribe = subscribeToUserProfileChanges(currentUserProfile.id, userRole, (updatedProfile) => {
    //     setCurrentUserProfile(updatedProfile);
    //     toast.info("Profile updated in real-time.");
    //   });
    // }

    return () => {
      authListener.subscription.unsubscribe();
      // if (unsubscribe) {
      //   unsubscribe();
      // }
    };
  }, [fetchUserAndProfile]);

  const updateUser = useCallback(async (updatedProfileData: Partial<Student | Mentor | Admin>) => {
    if (!currentUserProfile || !userRole || !sessionUser) {
      toast.error("User session or profile not available for update.");
      console.error("Update attempt without user session, role, or current profile.", { currentUserProfile, userRole, sessionUser });
      return null;
    }
    setLoading(true);
    try {
      // Ensure the updatedProfileData contains the ID and role for the service
      const fullUpdatedUser = { 
        ...currentUserProfile, 
        ...updatedProfileData,
        id: sessionUser.id, // Ensure ID from sessionUser is used
        role: userRole 
      } as Student | Mentor | Admin;
      
      const updatedData = await updateUserProfileService(fullUpdatedUser, sessionUser as any, userRole);
      setCurrentUserProfile(updatedData); // Update state with the data returned from the service
      toast.success("Profile updated successfully!");
      return updatedData;
    } catch (e: any) {
      console.error('Error updating user profile:', e);
      setError(e.message || 'Failed to update profile');
      toast.error(e.message || 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUserProfile, userRole, sessionUser]);

  return { 
    currentUser: currentUserProfile, // Renamed for clarity if preferred, or stick to currentUserProfile
    userRole, 
    sessionUser, // Exposing Supabase session user might be useful
    loading, 
    error, 
    updateUserProfile: updateUser, 
    refetchUserProfile: fetchUserAndProfile 
  };
};

// Optionally, re-export utilities from the subdirectory if that's the desired pattern.
// This makes them available via "import { someUtil } from '@/hooks/useUserProfile';"
export * from './useUserProfile/transformUtils';
export * from './useUserProfile/fetchUserProfile';
export * from './useUserProfile/updateUser';
export * from './useUserProfile/userSubscription';
