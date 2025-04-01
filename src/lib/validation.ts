
import { z } from 'zod';
import { Outpass } from './types';

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Validates phone number format (simple)
 */
export function validatePhone(phone: string): boolean {
  const phonePattern = /^\d{10,15}$/;
  return phonePattern.test(phone);
}

/**
 * Validates password strength
 * - At least 6 characters
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validates outpass request form data
 */
export function validateOutpassRequest(data: any): string | null {
  // Check for required fields
  if (!data.studentId || !data.studentName || !data.enrollmentNumber || !data.exitDateTime || !data.reason) {
    return "All fields are required";
  }
  
  // Validate exit time is within allowed range (9:15 AM - 3:10 PM)
  const exitTime = new Date(data.exitDateTime);
  const hours = exitTime.getHours();
  const minutes = exitTime.getMinutes();
  
  if (hours < 9 || (hours === 9 && minutes < 15) || hours > 15 || (hours === 15 && minutes > 10)) {
    return "Exit time must be between 9:15 AM and 3:10 PM";
  }
  
  // All validations passed
  return null;
}

/**
 * Validates outpass object structure using Zod
 */
export function validateOutpass(outpass: any): Outpass | null {
  try {
    // Define Zod schema for outpass validation with more flexible date handling
    const outpassSchema = z.object({
      id: z.string(),
      studentId: z.string(),
      studentName: z.string(),
      enrollmentNumber: z.string(),
      exitDateTime: z.string(),
      reason: z.string(),
      status: z.enum(['pending', 'approved', 'denied']),
      mentorId: z.string().optional().nullable(),
      mentorName: z.string().optional().nullable(),
      qrCode: z.string().optional().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      scanTimestamp: z.string().optional().nullable(),
      denyReason: z.string().optional().nullable(),
      studentSection: z.string().optional().nullable(),
      serialCode: z.string().optional().nullable(),
    });

    // Parse and validate the outpass object
    return outpassSchema.parse(outpass);
  } catch (error) {
    console.error("Outpass validation error:", error);
    return null;
  }
}
