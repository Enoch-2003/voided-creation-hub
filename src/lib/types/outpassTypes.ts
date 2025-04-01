
export type OutpassStatus = 'pending' | 'approved' | 'denied';

export interface SerialCodeLog {
  id: string;
  prefix: string;
  createdAt: string;
  createdBy: string;
}

// Database schema column names
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
