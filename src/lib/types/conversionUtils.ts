
import { Outpass, OutpassDB, Student, StudentDB, Mentor, MentorDB, AdminDB, Admin } from './';

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

export function dbToStudentFormat(studentDb: StudentDB): Student {
  return {
    id: studentDb.id,
    name: studentDb.name,
    email: studentDb.email,
    role: 'student',
    password: studentDb.password,
    enrollmentNumber: studentDb.enrollment_number,
    contactNumber: studentDb.contact_number,
    guardianEmail: studentDb.guardian_email,
    department: studentDb.department,
    course: studentDb.course,
    branch: studentDb.branch,
    semester: studentDb.semester,
    section: studentDb.section
  };
}

export function mentorToDbFormat(mentor: Mentor): MentorDB {
  return {
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    password: mentor.password || '',
    role: mentor.role,
    contact_number: mentor.contactNumber,
    department: mentor.department,
    branches: mentor.branches,
    courses: mentor.courses,
    semesters: mentor.semesters,
    sections: mentor.sections
  };
}

export function dbToMentorFormat(mentorDb: MentorDB): Mentor {
  return {
    id: mentorDb.id,
    name: mentorDb.name,
    email: mentorDb.email,
    role: 'mentor',
    password: mentorDb.password,
    contactNumber: mentorDb.contact_number,
    department: mentorDb.department,
    branches: mentorDb.branches,
    courses: mentorDb.courses,
    semesters: mentorDb.semesters,
    sections: mentorDb.sections
  };
}

// Delete the original types.ts after confirming the refactored version works
<lov-delete file_path="src/lib/types.ts" />
