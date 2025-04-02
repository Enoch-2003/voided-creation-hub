
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Student, dbToStudentFormat } from '@/lib/types';
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
      
      // Convert database format to Student format
      if (data) {
        // Use dbToStudentFormat from lib/types to convert the format
        const studentData = dbToStudentFormat(data);
        setStudent(studentData);
      }
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
      
      // Convert to snake_case for database
      const dbData = {
        ...(dataToUpdate.name !== undefined && { name: dataToUpdate.name }),
        ...(dataToUpdate.email !== undefined && { email: dataToUpdate.email }),
        ...(dataToUpdate.contactNumber !== undefined && { contact_number: dataToUpdate.contactNumber }),
        ...(dataToUpdate.guardianEmail !== undefined && { guardian_email: dataToUpdate.guardianEmail }),
        ...(dataToUpdate.department !== undefined && { department: dataToUpdate.department }),
        ...(dataToUpdate.course !== undefined && { course: dataToUpdate.course }),
        ...(dataToUpdate.branch !== undefined && { branch: dataToUpdate.branch }),
        ...(dataToUpdate.semester !== undefined && { semester: dataToUpdate.semester }),
        ...(dataToUpdate.section !== undefined && { section: dataToUpdate.section }),
      };
      
      const { data, error } = await supabase
        .from('students')
        .update(dbData)
        .eq('id', student.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Convert database format to Student format
      if (data) {
        const updatedStudentData = dbToStudentFormat(data);
        setStudent(updatedStudentData);
        toast.success('Student information updated successfully');
        return updatedStudentData;
      }
      
      return null;
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
