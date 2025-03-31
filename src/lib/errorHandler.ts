
import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Centralized error handling for API requests
 * 
 * @param error The error object to handle
 * @param context Additional context about where the error occurred
 * @returns Formatted error message
 */
export function handleApiError(error: unknown, context = 'Operation'): string {
  console.error(`Error in ${context}:`, error);
  
  // Default error message
  let errorMessage = `${context} failed. Please try again.`;
  
  // Handle Supabase specific errors
  if (isPostgrestError(error)) {
    const { code, message, details } = error;
    
    // Common Supabase error codes
    switch (code) {
      case '23505': // unique_violation
        errorMessage = 'This record already exists.';
        break;
      case '23503': // foreign_key_violation
        errorMessage = 'Referenced record does not exist.';
        break;
      case '42P01': // undefined_table
        errorMessage = 'Database configuration issue. Please contact support.';
        break;
      case '42501': // insufficient_privilege
        errorMessage = 'You do not have permission to perform this action.';
        break;
      default:
        errorMessage = message || errorMessage;
    }
    
    // Include additional details if available
    if (details) {
      console.error('Error details:', details);
    }
  }
  // Handle network errors
  else if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else {
      errorMessage = error.message || errorMessage;
    }
  }
  
  // Display error toast
  toast.error(errorMessage);
  
  return errorMessage;
}

/**
 * Type guard for Supabase PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

/**
 * Error boundary for async functions
 * Wraps an async function with try/catch and error handling
 * 
 * @param fn The async function to wrap
 * @param context Context for error handling
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  context: string
): (...args: Args) => Promise<T | null> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, context);
      return null;
    }
  };
}

/**
 * Check if the current user has permissions for a specific action
 * 
 * @param requiredRole The required role to perform the action
 * @returns Boolean indicating if the user has permission
 */
export function hasPermission(requiredRole: 'student' | 'mentor' | 'admin'): boolean {
  const userRole = sessionStorage.getItem('userRole');
  
  // Admin has all permissions
  if (userRole === 'admin') return true;
  
  // Mentor has mentor and student permissions
  if (userRole === 'mentor' && (requiredRole === 'mentor' || requiredRole === 'student')) return true;
  
  // Student only has student permissions
  if (userRole === 'student' && requiredRole === 'student') return true;
  
  return false;
}

/**
 * Format validation error messages from form submission
 * 
 * @param errors Object containing validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  const errorList = Object.entries(errors)
    .map(([field, message]) => `• ${field}: ${message}`)
    .join('\n');
  
  return `Please fix the following errors:\n${errorList}`;
}
