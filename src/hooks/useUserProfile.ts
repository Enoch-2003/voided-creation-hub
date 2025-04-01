
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
  const [isLoading, setIsLoading] = useState(true);

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
    
    setIsLoading(false);
  }, []);

  // If user role changes, update profile data from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser || !userRole) return;
      
      try {
        setIsLoading(true);
        let userData;
        let tableName: "students" | "mentors" | "admins";
        
        if (userRole === 'student') {
          tableName = 'students';
        } else if (userRole === 'mentor') {
          tableName = 'mentors';
        } else if (userRole === 'admin') {
          tableName = 'admins';
        } else {
          setIsLoading(false);
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
            const studentData = userData as {
              guardian_email?: string;
              enrollment_number: string;
              contact_number?: string;
              id: string;
              name: string;
              email: string;
              department?: string;
              course?: string;
              branch?: string;
              semester?: string;
              section?: string;
              [key: string]: any;
            };
            
            const mappedUser: Student = {
              id: studentData.id,
              name: studentData.name,
              email: studentData.email,
              role: 'student',
              guardianEmail: studentData.guardian_email,
              enrollmentNumber: studentData.enrollment_number,
              contactNumber: studentData.contact_number,
              department: studentData.department,
              course: studentData.course,
              branch: studentData.branch,
              semester: studentData.semester,
              section: studentData.section
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
    
    // Set up real-time subscription for user profile updates
    let tableName: "students" | "mentors" | "admins" | null = null;
    if (userRole === 'student') tableName = 'students';
    else if (userRole === 'mentor') tableName = 'mentors';
    else if (userRole === 'admin') tableName = 'admins';
    
    if (tableName && currentUser) {
      const channel = supabase
        .channel(`${tableName}-changes-${currentUser.id}`)
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: tableName,
            filter: `id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log(`${tableName} profile updated:`, payload.new);
            // Refetch user profile data to update the state
            fetchUserProfile();
            
            // Show toast notification
            toast.success("Your profile information has been updated");
          })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id, userRole]);

  // Function to update the user
  const updateUser = useCallback(async (updatedUser: Student | Mentor | Admin) => {
    try {
      // Ensure semester is always a string if it exists and is a student
      if ('role' in updatedUser && updatedUser.role === 'student') {
        const studentUser = updatedUser as Student;
        if (studentUser.semester !== undefined) {
          studentUser.semester = String(studentUser.semester);
        }
      }
      
      // Determine which table to update based on user role
      let tableName: "students" | "mentors" | "admins";
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
        if (student.guardianEmail !== undefined) {
          dbUser.guardian_email = student.guardianEmail;
          delete dbUser.guardianEmail;
        }
        if (student.enrollmentNumber !== undefined) {
          dbUser.enrollment_number = student.enrollmentNumber;
          delete dbUser.enrollmentNumber;
        }
        if (student.contactNumber !== undefined) {
          dbUser.contact_number = student.contactNumber;
          delete dbUser.contactNumber;
        }
      } else if (updatedUser.role === 'mentor') {
        const mentor = updatedUser as Mentor;
        if (mentor.contactNumber !== undefined) {
          dbUser.contact_number = mentor.contactNumber;
          delete dbUser.contactNumber;
        }
      }
      
      // Create a copy without the password for safety if no new password provided
      if (!dbUser.password) {
        // If updating without a password, don't send the password field at all
        delete dbUser.password;
      }
      
      console.log(`Updating ${tableName} with data:`, dbUser);
      
      // Update the database
      const { data, error } = await supabase
        .from(tableName)
        .update(dbUser)
        .eq('id', updatedUser.id)
        .select();
      
      if (error) throw error;
      console.log(`${tableName} update result:`, data);
      
      // Create a safe user object without password for session storage
      const safeUser = { ...dbUser };
      delete safeUser.password;
      
      // Update session storage for this tab
      if (updatedUser.id === currentUser?.id) {
        // Remap fields from DB format to frontend format for students
        if (updatedUser.role === 'student' && data && data[0]) {
          const dbStudent = data[0] as {
            guardian_email?: string;
            enrollment_number: string;
            contact_number?: string;
            id: string;
            name: string;
            email: string;
            department?: string;
            course?: string;
            branch?: string;
            semester?: string;
            section?: string;
            [key: string]: any;
          };
          
          const mappedUser: Student = {
            id: dbStudent.id,
            name: dbStudent.name,
            email: dbStudent.email,
            role: 'student',
            guardianEmail: dbStudent.guardian_email,
            enrollmentNumber: dbStudent.enrollment_number,
            contactNumber: dbStudent.contact_number,
            department: dbStudent.department,
            course: dbStudent.course,
            branch: dbStudent.branch,
            semester: dbStudent.semester,
            section: dbStudent.section
          };
          delete mappedUser.password; // Remove password for security
          sessionStorage.setItem('user', JSON.stringify(mappedUser));
          setCurrentUser(mappedUser);
        } else {
          sessionStorage.setItem('user', JSON.stringify(safeUser));
          setCurrentUser(safeUser as Student | Mentor | Admin);
        }
      }
      
      // Show toast notification for user updates
      if (userRole === 'student' && updatedUser.id === currentUser?.id) {
        toast.info("Your profile information has been updated");
      } else {
        toast.info(`User ${updatedUser.name} has been updated`);
      }
      
      return safeUser;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user information. Please try again.');
      throw error;
    }
  }, [currentUser?.id, userRole]);

  return { 
    currentUser, 
    userRole,
    isLoading, 
    updateUser 
  };
}
