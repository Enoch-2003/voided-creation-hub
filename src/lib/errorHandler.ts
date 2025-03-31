
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Handle API errors from Supabase or other sources and provide meaningful error messages
 * 
 * @param error The error object
 * @param context A description of the operation that failed (e.g., "Fetching outpasses")
 * @returns void
 */
export function handleApiError(error: unknown, context: string = "operation"): void {
  console.error(`${context} error:`, error);
  
  // Handle Supabase errors
  if (isPostgrestError(error)) {
    const message = getPostgrestErrorMessage(error);
    toast.error(message);
    return;
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    toast.error(error.message || `An error occurred during ${context.toLowerCase()}`);
    return;
  }
  
  // Handle unknown errors
  toast.error(`An unexpected error occurred during ${context.toLowerCase()}`);
}

/**
 * Type guard to check if an object is a PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && 
    error !== null && 
    'code' in error && 
    'message' in error &&
    'details' in error;
}

/**
 * Get a user-friendly error message from a PostgrestError
 */
function getPostgrestErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case "PGRST116":
      return "The requested resource was not found";
    case "PGRST109":
      return "The request was malformed or invalid";
    case "23505":
      return "This record already exists";
    case "42P01":
      return "The requested table or view does not exist";
    case "42501":
      return "You don't have permission to access this resource";
    default:
      return error.message || "An unexpected database error occurred";
  }
}

/**
 * Check if a value is defined (not undefined or null)
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
