
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/lib/types';
import { toast } from 'sonner';

/**
 * Custom hook to fetch and manage student data
 */
export function useStudentData(studentId?: string) {
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch student data by ID
  const fetchStudentById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      // Remove password for security
      if (data && 'password' in data) {
        delete (data as any).password;
      }
      
      setStudent(data as Student);
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to load student data');
      toast.error('Failed to load student data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update student data
  const updateStudent = async (updatedStudent: Partial<Student>) => {
    if (!student?.id) {
      toast.error('Cannot update: No student selected');
      return null;
    }
    
    try {
      setIsLoading(true);
      
      // Remove the password field if it exists and is empty
      const dataToUpdate = { ...updatedStudent };
      if ('password' in dataToUpdate && !dataToUpdate.password) {
        delete dataToUpdate.password;
      }
      
      const { data, error } = await supabase
        .from('students')
        .update(dataToUpdate)
        .eq('id', student.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Remove password for security
      if (data && 'password' in data) {
        delete (data as any).password;
      }
      
      setStudent(data as Student);
      toast.success('Student information updated successfully');
      return data as Student;
    } catch (err) {
      console.error('Error updating student:', err);
      toast.error('Failed to update student information');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch student on mount if ID is provided
  useEffect(() => {
    if (studentId) {
      fetchStudentById(studentId);
    } else {
      setIsLoading(false);
    }
  }, [studentId]);
  
  return {
    student,
    isLoading,
    error,
    fetchStudentById,
    updateStudent,
    setStudent
  };
}
