
import { z } from 'zod';
import { Outpass, OutpassStatus, User } from './types';

// Basic schemas
const userRoleSchema = z.enum(['student', 'mentor', 'admin']);
const outpassStatusSchema = z.enum(['pending', 'approved', 'denied']);
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();
const dateTimeSchema = z.string().datetime();

// User schema
export const userSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, "Name is required"),
  email: emailSchema,
  role: userRoleSchema
});

// Outpass schema for validating outpass objects
export const outpassSchema = z.object({
  id: uuidSchema,
  studentId: uuidSchema,
  studentName: z.string().min(1, "Student name is required"),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  exitDateTime: dateTimeSchema.or(z.date()),
  reason: z.string().min(1, "Reason is required"),
  status: outpassStatusSchema,
  mentorId: uuidSchema.optional().nullable(),
  mentorName: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
  createdAt: dateTimeSchema.or(z.date()),
  updatedAt: dateTimeSchema.or(z.date()),
  scanTimestamp: dateTimeSchema.optional().nullable(),
  denyReason: z.string().optional().nullable(),
  studentSection: z.string().optional().nullable(),
  serialCode: z.string().optional().nullable()
});

// Student schema
export const studentSchema = userSchema.extend({
  role: z.literal('student'),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  contactNumber: z.string().optional().nullable(),
  guardianEmail: emailSchema.optional().nullable(),
  department: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  semester: z.string().optional().nullable(),
  section: z.string().optional().nullable()
});

// Mentor schema
export const mentorSchema = userSchema.extend({
  role: z.literal('mentor'),
  contactNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  branches: z.array(z.string()).optional().nullable(),
  courses: z.array(z.string()).optional().nullable(),
  semesters: z.array(z.string()).optional().nullable(),
  sections: z.array(z.string()).optional().nullable()
});

// Login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Admin login form schema
export const adminLoginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

/**
 * Validate an outpass object against the schema
 * 
 * @param outpass The outpass object to validate
 * @returns Validated outpass or null if invalid
 */
export function validateOutpass(outpass: unknown): Outpass | null {
  try {
    return outpassSchema.parse(outpass) as Outpass;
  } catch (error) {
    console.error('Outpass validation error:', error);
    return null;
  }
}

/**
 * Validate an user object against the schema
 * 
 * @param user The user object to validate
 * @returns Validated user or null if invalid
 */
export function validateUser(user: unknown): User | null {
  try {
    return userSchema.parse(user) as User;
  } catch (error) {
    console.error('User validation error:', error);
    return null;
  }
}

/**
 * Check if a string is a valid outpass status
 */
export function isValidOutpassStatus(status: string): status is OutpassStatus {
  return ['pending', 'approved', 'denied'].includes(status);
}

/**
 * Check if a string is a valid user role
 */
export function isValidUserRole(role: string): boolean {
  return ['student', 'mentor', 'admin'].includes(role);
}

/**
 * Ensure timestamps are in ISO format
 */
export function ensureISODateString(date: string | Date): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (typeof date === 'string') {
    try {
      return new Date(date).toISOString();
    } catch (error) {
      console.error('Invalid date string:', error);
    }
  }
  return new Date().toISOString();
}
