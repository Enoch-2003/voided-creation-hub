
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

// Function to generate a random ID (for demo purposes)
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Mock function to generate QR code data (for demo purposes)
export function generateQRCode(outpassId: string): string {
  return `https://amipass.com/verify/${outpassId}`;
}

// Mock authentication (for demo purposes)
export function mockAuthenticate(
  identifier: string,
  password: string,
  role: "student" | "mentor"
): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // For demo, we'll accept any login
      if (password.length >= 6) {
        if (role === "student") {
          resolve({
            id: generateId(),
            name: "John Doe",
            email: "john.doe@example.com",
            role: "student",
            enrollmentNumber: identifier,
            contactNumber: "+1234567890",
            guardianNumber: "+0987654321",
            department: "Computer Science",
            course: "B.Tech",
            branch: "Computer Science",
            semester: "4",
            section: "A",
          });
        } else {
          resolve({
            id: generateId(),
            name: "Dr. Jane Smith",
            email: identifier,
            role: "mentor",
            department: "Computer Science",
            branches: ["Computer Science", "Information Technology"],
            courses: ["B.Tech", "M.Tech"],
            semesters: ["3", "4", "5"],
            sections: ["A", "B"],
          });
        }
      } else {
        reject(new Error("Invalid credentials"));
      }
    }, 800);
  });
}

// Mock outpass data generation (for demo purposes)
export function getMockOutpasses(userId: string, role: "student" | "mentor"): Outpass[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const baseOutpasses = [
    {
      id: generateId(),
      studentId: role === "student" ? userId : generateId(),
      studentName: "John Doe",
      enrollmentNumber: "CS20220001",
      exitDateTime: tomorrow.toISOString(),
      reason: "Medical appointment",
      status: "pending" as OutpassStatus,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: generateId(),
      studentId: role === "student" ? userId : generateId(),
      studentName: "John Doe",
      enrollmentNumber: "CS20220001",
      exitDateTime: yesterday.toISOString(),
      reason: "Family function",
      status: "approved" as OutpassStatus,
      mentorId: role === "mentor" ? userId : generateId(),
      mentorName: "Dr. Jane Smith",
      qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=OUTPASS_ID_12345",
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
    {
      id: generateId(),
      studentId: role === "student" ? userId : generateId(),
      studentName: "John Doe",
      enrollmentNumber: "CS20220001",
      exitDateTime: yesterday.toISOString(),
      reason: "Personal work",
      status: "denied" as OutpassStatus,
      mentorId: role === "mentor" ? userId : generateId(),
      mentorName: "Dr. Jane Smith",
      denyReason: "Insufficient information provided",
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString(),
    },
  ];

  // If it's a mentor, add more outpasses for different students
  if (role === "mentor") {
    return [
      ...baseOutpasses,
      {
        id: generateId(),
        studentId: generateId(),
        studentName: "Alice Johnson",
        enrollmentNumber: "CS20220002",
        exitDateTime: tomorrow.toISOString(),
        reason: "Family emergency",
        status: "pending" as OutpassStatus,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: generateId(),
        studentId: generateId(),
        studentName: "Bob Williams",
        enrollmentNumber: "CS20220003",
        exitDateTime: tomorrow.toISOString(),
        reason: "Doctor's appointment",
        status: "pending" as OutpassStatus,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    ];
  }

  return baseOutpasses;
}
