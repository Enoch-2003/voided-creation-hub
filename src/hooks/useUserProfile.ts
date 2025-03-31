
import { useState, useEffect, useCallback } from 'react';
import { Student, Mentor, Admin, UserRole } from '@/lib/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook for managing user profile data
 */
export function useUserProfile() {
  const [currentUser, setCurrentUser] = useState<Student | Mentor | Admin | null>(null);
  const [userRole, setUserRole] = useState<UserRole | "admin" | null>(null);

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

  // If user role changes, update profile data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser || !userRole) return;
      
      try {
        let userData;
        let tableName: string;
        
        if (userRole === 'student') {
          tableName = 'students';
        } else if (userRole === 'mentor') {
          tableName = 'mentors';
        } else if (userRole === 'admin') {
          tableName = 'admins';
        } else {
          return; // Invalid role
        }
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error) throw error;
        userData = data;
        
        if (userData) {
          // Map database column names to camelCase for our frontend when needed
          if (userRole === 'student') {
            const mappedUser: Student = {
              ...userData,
              role: 'student',
              guardianEmail: userData.guardian_email,
              enrollmentNumber: userData.enrollment_number,
              contactNumber: userData.contact_number
            };
            delete mappedUser.password; // Remove password for security
            setCurrentUser(mappedUser);
            sessionStorage.setItem('user', JSON.stringify(mappedUser));
          } else {
            // Remove password for security
            const safeUser = { ...userData };
            delete safeUser.password;
            
            // Update session storage
            sessionStorage.setItem('user', JSON.stringify(safeUser));
            setCurrentUser(safeUser);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [currentUser?.id, userRole]);

  // Function to update the user
  const updateUser = useCallback(async (updatedUser: Student | Mentor | Admin) => {
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
      
      // Transform camelCase to snake_case for database
      const dbUser: any = { ...updatedUser };
      
      // Handle special fields for student
      if (updatedUser.role === 'student') {
        const student = updatedUser as Student;
        if (student.guardianEmail) {
          dbUser.guardian_email = student.guardianEmail;
          delete dbUser.guardianEmail;
        }
        if (student.enrollmentNumber) {
          dbUser.enrollment_number = student.enrollmentNumber;
          delete dbUser.enrollmentNumber;
        }
        if (student.contactNumber) {
          dbUser.contact_number = student.contactNumber;
          delete dbUser.contactNumber;
        }
      }
      
      // Create a copy without the password for safety if no new password provided
      if (!dbUser.password) {
        // If updating without a password, get current password
        const { data } = await supabase
          .from(tableName)
          .select('password')
          .eq('id', updatedUser.id)
          .single();
          
        if (data) {
          dbUser.password = data.password;
        }
      }
      
      // Update the database
      const { error } = await supabase
        .from(tableName)
        .update(dbUser)
        .eq('id', updatedUser.id);
      
      if (error) throw error;
      
      // Create a safe user object without password for session storage
      delete dbUser.password;
      
      // Update session storage for this tab
      if (updatedUser.id === currentUser?.id) {
        sessionStorage.setItem('user', JSON.stringify(dbUser));
        setCurrentUser(dbUser);
      }
      
      // Show toast notification for user updates
      if (userRole === 'student' && updatedUser.id === currentUser?.id) {
        toast.info("Your profile information has been updated");
      }
      
      return dbUser;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user information. Please try again.');
    }
  }, [currentUser?.id, userRole]);

  return { 
    currentUser, 
    userRole, 
    updateUser 
  };
}
