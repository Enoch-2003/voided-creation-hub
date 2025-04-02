
import { Student, Mentor, Admin } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { transformUserForDb, mapDbStudentToFrontend, createSafeUser } from './transformUtils';

/**
 * Function to update user data in the database
 */
export async function updateUserProfile(
  updatedUser: Student | Mentor | Admin, 
  currentUser: Student | Mentor | Admin | null,
  userRole: string | null
): Promise<any> {
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
    
    // Transform user data for database
    const dbUser = transformUserForDb(updatedUser);
    
    console.log(`Updating ${tableName} with data:`, dbUser);
    
    // Update the database
    const { data, error } = await supabase
      .from(tableName)
      .update(dbUser)
      .eq('id', updatedUser.id)
      .select();
    
    if (error) throw error;
    console.log(`${tableName} update result:`, data);
    
    // Create a safe user object without password
    const safeUser = createSafeUser(dbUser);
    
    // Return the updated user with proper mappings
    if (updatedUser.role === 'student' && data && data[0]) {
      return mapDbStudentToFrontend(data[0]);
    }
    
    // For other roles, just return the safe user
    return safeUser;
  } catch (error) {
    console.error('Error updating user:', error);
    toast.error('Failed to update user information. Please try again.');
    throw error;
  }
}
