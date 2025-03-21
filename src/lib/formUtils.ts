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
