
import { supabase } from '@/integrations/supabase/client';
import { Student, Mentor, Admin, UserRole } from '@/lib/types';
import { mapDbStudentToFrontend, mapDbMentorToFrontend, mapDbAdminToFrontend } from './transformUtils';

/**
 * Fetch user profile data from the database
 */
export async function fetchUserProfileData(
  currentUser: Student | Mentor | Admin | null,
  userRole: UserRole | "admin" | null
): Promise<Student | Mentor | Admin | null> {
  if (!currentUser || !userRole) return null;
  
  try {
    let tableName: "students" | "mentors" | "admins";
    
    if (userRole === 'student') {
      tableName = 'students';
    } else if (userRole === 'mentor') {
      tableName = 'mentors';
    } else if (userRole === 'admin') {
      tableName = 'admins';
    } else {
      return null; // Invalid role
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', currentUser.id)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Map database column names to camelCase for our frontend based on role
    if (userRole === 'student') {
      return mapDbStudentToFrontend(data);
    } else if (userRole === 'mentor') {
      return mapDbMentorToFrontend(data);
    } else if (userRole === 'admin') {
      return mapDbAdminToFrontend(data);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
