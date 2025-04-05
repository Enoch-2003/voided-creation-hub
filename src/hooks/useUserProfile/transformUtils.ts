
import { Student, Mentor, Admin } from '@/lib/types';

/**
 * Maps database column names to camelCase for student frontend model
 */
export function mapDbStudentToFrontend(dbStudent: {
  guardian_email?: string;
  enrollment_number: string;
  contact_number?: string;
  id: string;
  name: string;
  email: string;
  department?: string;
  course?: string;
  branch?: string;
  semester?: string;
  section?: string;
  [key: string]: any;
}): Student {
  const mappedUser: Student = {
    id: dbStudent.id,
    name: dbStudent.name,
    email: dbStudent.email,
    role: 'student',
    guardianEmail: dbStudent.guardian_email,
    enrollmentNumber: dbStudent.enrollment_number,
    contactNumber: dbStudent.contact_number,
    department: dbStudent.department,
    course: dbStudent.course,
    branch: dbStudent.branch,
    semester: dbStudent.semester,
    section: dbStudent.section
  };
  delete mappedUser.password; // Remove password for security
  return mappedUser;
}

/**
 * Maps database column names to camelCase for mentor frontend model
 */
export function mapDbMentorToFrontend(dbMentor: {
  id: string;
  name: string;
  email: string;
  contact_number?: string;
  department?: string;
  branches?: string[];
  courses?: string[];
  semesters?: string[];
  sections?: string[];
  [key: string]: any;
}): Mentor {
  const mappedUser: Mentor = {
    id: dbMentor.id,
    name: dbMentor.name,
    email: dbMentor.email,
    role: 'mentor',
    contactNumber: dbMentor.contact_number,
    department: dbMentor.department,
    branches: dbMentor.branches,
    courses: dbMentor.courses,
    semesters: dbMentor.semesters,
    sections: dbMentor.sections
  };
  delete mappedUser.password; // Remove password for security
  return mappedUser;
}

/**
 * Maps database column names to camelCase for admin frontend model
 */
export function mapDbAdminToFrontend(dbAdmin: {
  id: string;
  name: string;
  email?: string;
  username: string;
  [key: string]: any;
}): Admin {
  const mappedUser: Admin = {
    id: dbAdmin.id,
    name: dbAdmin.name,
    email: dbAdmin.email || '',
    role: 'admin'
  };
  delete mappedUser.password; // Remove password for security
  return mappedUser;
}

/**
 * Transform camelCase fields to snake_case for database operations
 */
export function transformUserForDb(updatedUser: Student | Mentor | Admin): any {
  // Transform camelCase to snake_case for database
  const dbUser: any = { ...updatedUser };
  
  // Handle special fields for student
  if (updatedUser.role === 'student') {
    const student = updatedUser as Student;
    if (student.guardianEmail !== undefined) {
      dbUser.guardian_email = student.guardianEmail;
      delete dbUser.guardianEmail;
    }
    if (student.enrollmentNumber !== undefined) {
      dbUser.enrollment_number = student.enrollmentNumber;
      delete dbUser.enrollmentNumber;
    }
    if (student.contactNumber !== undefined) {
      dbUser.contact_number = student.contactNumber;
      delete dbUser.contactNumber;
    }
  } else if (updatedUser.role === 'mentor') {
    const mentor = updatedUser as Mentor;
    if (mentor.contactNumber !== undefined) {
      dbUser.contact_number = mentor.contactNumber;
      delete dbUser.contactNumber;
    }
  }

  // Create a copy without the password for safety if no new password provided
  if (!dbUser.password) {
    // If updating without a password, don't send the password field at all
    delete dbUser.password;
  }
  
  return dbUser;
}

/**
 * Creates a safe user object without password for session storage
 */
export function createSafeUser(user: any): any {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}
