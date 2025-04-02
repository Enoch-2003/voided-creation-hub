
import { Student } from "./types";

/**
 * Ensures a value is a string
 */
export const ensureString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  } else if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

/**
 * Sanitizes form data by ensuring all values are proper strings
 */
export const sanitizeFormData = (data: Record<string, unknown>): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, ensureString(value)])
  );
};

/**
 * Checks if there are any changes between original data and form data
 * Now accepts both Record<string, unknown> and Student types
 */
export const hasFormChanges = (
  originalData: Record<string, unknown> | Student,
  formData: Record<string, unknown>
): boolean => {
  const keys = Object.keys(formData);
  return keys.some(key => {
    // Handle both undefined and null values
    const originalValue = key in originalData ? (originalData as any)[key] : '';
    const formValue = formData[key] ?? '';
    
    // Convert both to strings for comparison
    return ensureString(originalValue) !== ensureString(formValue);
  });
};

/**
 * Searches student records by enrollment number, name, or section
 */
export const searchStudentsByEnrollment = (
  students: Student[],
  searchTerm: string
): Student[] => {
  const lowercaseSearch = searchTerm.toLowerCase();
  return students.filter(student => {
    return (
      (student.enrollmentNumber || '').toLowerCase().includes(lowercaseSearch) ||
      (student.name || '').toLowerCase().includes(lowercaseSearch) ||
      (student.section || '').toLowerCase().includes(lowercaseSearch)
    );
  });
};

/**
 * Load all students from Supabase (to be replaced with actual API call)
 */
export const loadAllStudents = (): Student[] => {
  // For now, just get data from localStorage since this will be replaced with Supabase
  const storedUsers = localStorage.getItem("users");
  if (!storedUsers) return [];
  
  const allUsers = JSON.parse(storedUsers);
  return allUsers.filter((user: any) => user.role === "student");
};
