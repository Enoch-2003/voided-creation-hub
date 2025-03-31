
import { useState, useEffect, useCallback } from 'react';
import { Outpass, Student, Mentor, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook for real-time outpass data using Supabase
 */
export function useOutpasses() {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Student | Mentor | any | null>(null);
  const [userRole, setUserRole] = useState<UserRole | "admin" | null>(null);
  const [tabId, setTabId] = useState<string>('');

  // Generate a unique tab ID for notifications
  useEffect(() => {
    setTabId(crypto.randomUUID().substring(0, 5));
  }, []);

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
  }, []);

  // Load initial outpass data and set up real-time subscription
  useEffect(() => {
    setIsLoading(true);
    
    // Initial fetch of outpasses
    const fetchOutpasses = async () => {
      try {
        const { data, error } = await supabase
          .from('outpasses')
          .select('*');
        
        if (error) {
          console.error('Error fetching outpasses:', error);
          return;
        }
        
        if (data) {
          setOutpasses(data as Outpass[]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error in fetchOutpasses:', error);
        setIsLoading(false);
      }
    };
    
    fetchOutpasses();
    
    // Subscribe to outpass changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'outpasses' },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            setOutpasses(prev => [...prev, newRecord as Outpass]);
          } else if (eventType === 'UPDATE') {
            setOutpasses(prev => 
              prev.map(outpass => outpass.id === newRecord.id ? newRecord as Outpass : outpass)
            );
            
            // Show toast notification based on status change
            if (userRole === 'student' && newRecord.status === 'approved' && oldRecord.status === 'pending') {
              toast.success(`Your outpass has been approved!`);
            } else if (userRole === 'student' && newRecord.status === 'denied' && oldRecord.status === 'pending') {
              toast.error(`Your outpass was denied: ${newRecord.deny_reason}`);
            }
          } else if (eventType === 'DELETE') {
            setOutpasses(prev => prev.filter(outpass => outpass.id !== oldRecord.id));
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);
  
  // If user role changes, update profile data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser || !userRole) return;
      
      try {
        let userData;
        
        if (userRole === 'student') {
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (error) throw error;
          userData = data;
          
        } else if (userRole === 'mentor') {
          const { data, error } = await supabase
            .from('mentors')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (error) throw error;
          userData = data;
          
        } else if (userRole === 'admin') {
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (error) throw error;
          userData = data;
        }
        
        if (userData) {
          // Remove password for security
          const safeUser = { ...userData };
          delete safeUser.password;
          
          // Update session storage
          sessionStorage.setItem('user', JSON.stringify(safeUser));
          setCurrentUser(safeUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [currentUser?.id, userRole]);

  // Get filtered outpasses based on user role
  const filteredOutpasses = outpasses.filter(outpass => {
    if (!currentUser) return false;
    
    if (userRole === 'student') {
      return outpass.student_id === currentUser.id;
    } else if (userRole === 'mentor') {
      const mentor = currentUser as Mentor;
      // Show outpasses for sections that the mentor manages
      return outpass.student_section && mentor.sections.includes(outpass.student_section);
    } else if (userRole === 'admin') {
      // Admin can see all outpasses
      return true;
    }
    
    return false;
  });

  // Function to update outpasses with real-time syncing
  const updateOutpass = useCallback(async (updatedOutpass: Outpass) => {
    try {
      // Update timestamp
      updatedOutpass.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('outpasses')
        .update(updatedOutpass)
        .eq('id', updatedOutpass.id);
      
      if (error) throw error;
      
      // Show toast for real-time feedback with tab ID
      const toastMessage = `[Tab: ${tabId}] `;
      
      if (userRole === 'mentor' && updatedOutpass.status === 'approved') {
        toast.success(`${toastMessage}Outpass for ${updatedOutpass.student_name} approved`);
      } else if (userRole === 'mentor' && updatedOutpass.status === 'denied') {
        toast.error(`${toastMessage}Outpass for ${updatedOutpass.student_name} denied`);
      }
    } catch (error) {
      console.error('Error updating outpass:', error);
      toast.error('Failed to update outpass. Please try again.');
    }
  }, [userRole, tabId]);

  // Function to add a new outpass with real-time syncing
  const addOutpass = useCallback(async (newOutpass: Outpass) => {
    try {
      const { error } = await supabase
        .from('outpasses')
        .insert(newOutpass);
      
      if (error) throw error;
      
      // Show toast for real-time feedback
      if (userRole === 'student') {
        toast.success(`[Tab: ${tabId}] Outpass request submitted successfully`);
      }
    } catch (error) {
      console.error('Error adding outpass:', error);
      toast.error('Failed to submit outpass request. Please try again.');
    }
  }, [userRole, tabId]);

  // Function to delete an outpass with real-time syncing
  const deleteOutpass = useCallback(async (outpassId: string) => {
    try {
      const { error } = await supabase
        .from('outpasses')
        .delete()
        .eq('id', outpassId);
      
      if (error) throw error;
      
      toast.success(`[Tab: ${tabId}] Outpass deleted successfully`);
    } catch (error) {
      console.error('Error deleting outpass:', error);
      toast.error('Failed to delete outpass. Please try again.');
    }
  }, [tabId]);

  // Function to update the user
  const updateUser = useCallback(async (updatedUser: Student | Mentor | any) => {
    try {
      // Force convert semester to string if it exists
      if (updatedUser && updatedUser.semester !== undefined) {
        updatedUser.semester = String(updatedUser.semester);
      }
      
      // Determine which table to update based on user role
      let tableName;
      if (updatedUser.role === 'student') {
        tableName = 'students';
      } else if (updatedUser.role === 'mentor') {
        tableName = 'mentors';
      } else if (updatedUser.role === 'admin') {
        tableName = 'admins';
      } else {
        throw new Error('Invalid user role');
      }
      
      // Create a copy without the password for safety
      const safeUser = { ...updatedUser };
      if (!safeUser.password) {
        // If updating without a password, get current password
        const { data } = await supabase
          .from(tableName)
          .select('password')
          .eq('id', updatedUser.id)
          .single();
          
        if (data) {
          safeUser.password = data.password;
        }
      }
      
      // Update the database
      const { error } = await supabase
        .from(tableName)
        .update(safeUser)
        .eq('id', updatedUser.id);
      
      if (error) throw error;
      
      // Create a safe user object without password for session storage
      delete safeUser.password;
      
      // Update session storage for this tab
      if (updatedUser.id === currentUser?.id) {
        sessionStorage.setItem('user', JSON.stringify(safeUser));
      }
      
      // Show toast notification for user updates
      if (userRole === 'student' && updatedUser.id === currentUser?.id) {
        toast.info("Your profile information has been updated");
      }
      
      return safeUser;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user information. Please try again.');
    }
  }, [currentUser?.id, userRole]);

  return {
    outpasses: filteredOutpasses,
    allOutpasses: outpasses, // For admin purposes if needed
    isLoading,
    updateOutpass,
    addOutpass,
    deleteOutpass,
    tabId,
    currentUser,
    updateUser
  };
}
