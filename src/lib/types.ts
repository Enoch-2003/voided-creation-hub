
export type UserRole = 'student' | 'mentor';

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
  guardianNumber: string;
  department: string;
  course: string;
  branch: string;
  semester: string;
  section: string;
}

export interface Mentor extends User {
  role: 'mentor';
  department: string;
  branches: string[];
  courses: string[];
  semesters: string[];
  sections: string[];
}

export type OutpassStatus = 'pending' | 'approved' | 'denied';

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
}
