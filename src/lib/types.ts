
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
  guardianEmail?: string; // Changed from guardianNumber to guardianEmail
  department?: string; // Now using college abbreviations like ASET, ABS, etc.
  course?: string;
  branch?: string;
  semester?: string;
  section?: string;
}

export interface Mentor extends User {
  role: 'mentor';
  contactNumber?: string; // Added contact number for mentors
  department?: string; // Now using college abbreviations like ASET, ABS, etc.
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

// Helper functions to convert between frontend and DB models
export function outpassToDbFormat(outpass: Outpass): OutpassDB {
  return {
    id: outpass.id,
    student_id: outpass.studentId,
    student_name: outpass.studentName,
    enrollment_number: outpass.enrollmentNumber,
    exit_date_time: outpass.exitDateTime,
    reason: outpass.reason,
    status: outpass.status,
    mentor_id: outpass.mentorId,
    mentor_name: outpass.mentorName,
    qr_code: outpass.qrCode,
    created_at: outpass.createdAt,
    updated_at: outpass.updatedAt,
    scan_timestamp: outpass.scanTimestamp,
    deny_reason: outpass.denyReason,
    student_section: outpass.studentSection,
    serial_code: outpass.serialCode
  };
}

export function dbToOutpassFormat(outpassDb: OutpassDB): Outpass {
  return {
    id: outpassDb.id,
    studentId: outpassDb.student_id,
    studentName: outpassDb.student_name,
    enrollmentNumber: outpassDb.enrollment_number,
    exitDateTime: outpassDb.exit_date_time,
    reason: outpassDb.reason,
    status: outpassDb.status as OutpassStatus,
    mentorId: outpassDb.mentor_id,
    mentorName: outpassDb.mentor_name,
    qrCode: outpassDb.qr_code,
    createdAt: outpassDb.created_at,
    updatedAt: outpassDb.updated_at,
    scanTimestamp: outpassDb.scan_timestamp,
    denyReason: outpassDb.deny_reason,
    studentSection: outpassDb.student_section,
    serialCode: outpassDb.serial_code
  };
}
