
import { Outpass, OutpassDB, OutpassStatus, Student, StudentDB } from './outpassTypes';

/**
 * Converts the database outpass format (snake_case) to frontend format (camelCase)
 */
export function dbToOutpassFormat(dbOutpass: OutpassDB): Outpass {
  return {
    id: dbOutpass.id,
    studentId: dbOutpass.student_id,
    studentName: dbOutpass.student_name,
    enrollmentNumber: dbOutpass.enrollment_number,
    exitDateTime: dbOutpass.exit_date_time,
    reason: dbOutpass.reason,
    status: dbOutpass.status as OutpassStatus,
    mentorId: dbOutpass.mentor_id,
    mentorName: dbOutpass.mentor_name,
    qrCode: dbOutpass.qr_code,
    createdAt: dbOutpass.created_at,
    updatedAt: dbOutpass.updated_at,
    scanTimestamp: dbOutpass.scan_timestamp,
    denyReason: dbOutpass.deny_reason,
    studentSection: dbOutpass.student_section,
    serialCode: dbOutpass.serial_code,
  };
}

/**
 * Converts the frontend outpass format (camelCase) to database format (snake_case)
 */
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
    serial_code: outpass.serialCode,
  };
}

/**
 * Converts student database format (snake_case) to frontend format (camelCase)
 */
export function dbToStudentFormat(dbStudent: any): Student {
  return {
    id: dbStudent.id,
    name: dbStudent.name,
    email: dbStudent.email,
    role: 'student',
    enrollmentNumber: dbStudent.enrollment_number,
    contactNumber: dbStudent.contact_number,
    guardianEmail: dbStudent.guardian_email,
    department: dbStudent.department,
    course: dbStudent.course,
    branch: dbStudent.branch,
    semester: dbStudent.semester,
    section: dbStudent.section
  };
}

/**
 * Converts student frontend format (camelCase) to database format (snake_case)
 */
export function studentToDbFormat(student: Student): StudentDB {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    password: student.password || '',
    role: student.role,
    enrollment_number: student.enrollmentNumber,
    contact_number: student.contactNumber,
    guardian_email: student.guardianEmail,
    department: student.department,
    course: student.course,
    branch: student.branch,
    semester: student.semester,
    section: student.section
  };
}
