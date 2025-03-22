
/**
 * Utility functions for form handling
 */

/**
 * Ensures a value is a string, converting numbers if necessary
 */
export const ensureString = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return String(value);
};

/**
 * Sanitizes form data to ensure all values are of the correct type
 */
export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Convert null/undefined to empty strings for text fields
    if (value === null || value === undefined) {
      sanitized[key] = '';
    } 
    // Convert string 'null'/'undefined' to empty strings
    else if (value === 'null' || value === 'undefined') {
      sanitized[key] = '';
    }
    // Keep all other values as is
    else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

/**
 * Checks if a form has any changes compared to original data
 */
export const hasFormChanges = (
  original: Record<string, any>,
  current: Record<string, any>
): boolean => {
  const relevantKeys = Object.keys(current);
  
  return relevantKeys.some(key => {
    // Convert values to strings for comparison
    const originalValue = ensureString(original[key]);
    const currentValue = ensureString(current[key]);
    
    return originalValue !== currentValue;
  });
};

/**
 * Normalizes a string for case-insensitive search
 */
export const normalizeString = (str: string): string => {
  return str.trim().toLowerCase();
};

/**
 * Search function to filter students by enrollment number or name
 */
export const searchStudentsByEnrollment = (
  students: any[],
  searchTerm: string
): any[] => {
  if (!searchTerm.trim()) return students;
  
  const normalizedSearch = normalizeString(searchTerm);
  
  return students.filter(student => {
    // Search by enrollment number (exact or partial match)
    if (student.enrollmentNumber && 
        normalizeString(student.enrollmentNumber).includes(normalizedSearch)) {
      return true;
    }
    
    // Search by name (exact or partial match)
    if (student.name && 
        normalizeString(student.name).includes(normalizedSearch)) {
      return true;
    }
    
    // Search by section
    if (student.section && 
        normalizeString(student.section).includes(normalizedSearch)) {
      return true;
    }
    
    return false;
  });
};

/**
 * Loads all student accounts from localStorage
 */
export const loadAllStudents = (): any[] => {
  try {
    // Get all users from localStorage
    const usersJson = localStorage.getItem("users");
    if (!usersJson) return [];
    
    const allUsers = JSON.parse(usersJson);
    
    // Filter to get only students
    return allUsers.filter((u: any) => u.role === "student");
  } catch (error) {
    console.error("Error loading student data:", error);
    return [];
  }
};

/**
 * MongoDB data conversion utilities
 * Prepares data for MongoDB integration
 */

/**
 * Converts data from localStorage format to MongoDB format
 * Adds _id field and converts dates to MongoDB compatible format
 */
export const prepareDataForMongoDB = <T extends Record<string, any>>(
  data: T
): Record<string, any> => {
  // Create a deep copy to avoid modifying the original
  const mongoData: Record<string, any> = JSON.parse(JSON.stringify(data));
  
  // Use the existing id as MongoDB _id if available
  if ('id' in data && !mongoData._id) {
    mongoData._id = data.id;
  }
  
  // Process date fields for MongoDB
  Object.keys(mongoData).forEach(key => {
    const value = mongoData[key];
    
    // Convert ISO date strings to Date objects
    if (typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      try {
        // Only convert if it's a valid date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          mongoData[key] = date;
        }
      } catch (e) {
        // Keep original value if conversion fails
      }
    }
  });
  
  return mongoData;
};

/**
 * Converts data from MongoDB format back to application format
 */
export const convertFromMongoDB = <T extends Record<string, any>>(
  mongoData: Record<string, any> & { _id?: string }
): Record<string, any> => {
  // Create a deep copy
  const appData: Record<string, any> = JSON.parse(JSON.stringify(mongoData));
  
  // Use MongoDB _id as the application id if needed
  if (mongoData._id && !('id' in mongoData)) {
    appData.id = mongoData._id.toString();
  }
  
  // Clean up MongoDB specific fields
  if ('_id' in appData) {
    delete appData._id;
  }
  
  return appData;
};

/**
 * Prepares a collection of items for MongoDB
 */
export const prepareCollectionForMongoDB = <T extends Record<string, any>>(
  items: T[]
): Record<string, any>[] => {
  return items.map(item => prepareDataForMongoDB(item));
};
