
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
  contactNumber: string;
  guardianEmail: string; // Changed from guardianNumber to guardianEmail
  department: string; // Now using college abbreviations like ASET, ABS, etc.
  course: string;
  branch: string;
  semester: string;
  section: string;
}

export interface Mentor extends User {
  role: 'mentor';
  department: string; // Now using college abbreviations like ASET, ABS, etc.
  contactNumber?: string; // Added contact number for mentors
  branches: string[];
  courses: string[];
  semesters: string[];
  sections: string[];
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
  studentSection?: string; // Added to match students with mentors
  serialCode?: string; // Full serial code including prefix
  viewed?: boolean; // Added to track if the outpass has been viewed
}
