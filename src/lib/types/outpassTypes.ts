
// User role and base types
export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Added for login authentication
}

export interface Student extends User {
  role: 'student';
  enrollmentNumber: string;
  contactNumber?: string;
  guardianEmail?: string; 
  department?: string;
  course?: string;
  branch?: string;
  semester?: string;
  section?: string;
}

export interface Mentor extends User {
  role: 'mentor';
  contactNumber?: string;
  department?: string;
  branches?: string[];
  courses?: string[];
  semesters?: string[];
  sections?: string[];
}

export interface Admin extends User {
  role: 'admin';
}

export type OutpassStatus = 'pending' | 'approved' | 'denied';

export interface SerialCodeLog {
  id: string;
  prefix: string;
  createdAt: string;
  createdBy: string;
}

// Database interface types for proper type checking when interacting with Supabase
export interface StudentDB {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  enrollment_number: string;
  contact_number?: string;
  guardian_email?: string;
  department?: string;
  course?: string;
  branch?: string;
  semester?: string;
  section?: string;
  created_at?: string;
}

export interface MentorDB {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  contact_number?: string;
  department?: string;
  branches?: string[];
  courses?: string[];
  semesters?: string[];
  sections?: string[];
  created_at?: string;
}

export interface AdminDB {
  id: string;
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
  created_at?: string;
}

// Updated to match database schema column names
export interface OutpassDB {
  id: string;
  student_id: string;
  student_name: string;
  enrollment_number: string;
  exit_date_time: string;
  reason: string;
  status: string;
  mentor_id?: string;
  mentor_name?: string;
  qr_code?: string;
  created_at: string;
  updated_at: string;
  scan_timestamp?: string;
  deny_reason?: string;
  student_section?: string;
  serial_code?: string;
}

// Frontend Outpass model - camelCase
export interface Outpass {
  id: string;
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  exitDateTime: string;
  reason: string;
  status: OutpassStatus;
  mentorId?: string;
  mentorName?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
  scanTimestamp?: string;
  denyReason?: string;
  studentSection?: string;
  serialCode?: string; // Full serial code including prefix
}

// Type guard functions
export function isStudent(user: User | Student | Mentor | Admin): user is Student {
  return user.role === 'student';
}

export function isMentor(user: User | Student | Mentor | Admin): user is Mentor {
  return user.role === 'mentor';
}

export function isAdmin(user: User | Student | Mentor | Admin): user is Admin {
  return user.role === 'admin';
}
