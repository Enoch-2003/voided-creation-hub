import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { UserRole } from "@/lib/types";
import { Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const studentRegistrationFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
  enrollmentNumber: z.string().regex(/^A\d{8}$/, {
    message: "Enrollment number must start with 'A' followed by 8 digits.",
  }),
  phone: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be a 10-digit number.",
  }),
  guardianEmail: z.string().email({
    message: "Please enter a valid guardian email address.",
  }),
  college: z.string().min(2, {
    message: "Please select a college",
  }),
  course: z.string().min(2, {
    message: "Please select a course",
  }),
  branch: z.string().min(2, {
    message: "Please select a branch",
  }),
  semester: z.number().min(1, {
    message: "Please select a semester",
  }),
  section: z.string().min(1, {
    message: "Please select a section",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const mentorRegistrationFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
  phone: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be a 10-digit number.",
  }),
  department: z.string().min(2, {
    message: "Please select a department",
  }),
  branch: z.string().min(2, {
    message: "Please select a branch",
  }),
  course: z.string().min(2, {
    message: "Please select a course",
  }),
  semester: z.string().min(1, {
    message: "Please select a semester",
  }),
  sections: z.string().array().nonempty({
    message: "Please select at least one section",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StudentRegistrationFormData = z.infer<typeof studentRegistrationFormSchema>;
type MentorRegistrationFormData = z.infer<typeof mentorRegistrationFormSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"student" | "mentor">("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);

  const {
    register: registerStudent,
    handleSubmit: handleStudentSubmit,
    formState: { errors: studentErrors },
  } = useForm<StudentRegistrationFormData>({
    resolver: zodResolver(studentRegistrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      enrollmentNumber: "",
      phone: "",
      guardianEmail: "",
      college: "",
      course: "",
      branch: "",
      semester: 1,
      section: "",
    },
  });

  const {
    register: registerMentor,
    handleSubmit: handleMentorSubmit,
    formState: { errors: mentorErrors },
  } = useForm<MentorRegistrationFormData>({
    resolver: zodResolver(mentorRegistrationFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      department: "",
      branch: "",
      course: "",
      semester: "",
      sections: [],
    },
  });

  useEffect(() => {
    if (isAuthSuccess) {
      // Short delay for transition effect before redirecting
      const timer = setTimeout(() => {
        const userRole = sessionStorage.getItem("userRole");
        if (userRole === "student") {
          navigate("/student");
        } else if (userRole === "mentor") {
          navigate("/mentor");
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isAuthSuccess, navigate]);

  const handleStudentRegister = async (data: StudentRegistrationFormData) => {
    setIsSubmitting(true);

    try {
      // Check if student with this enrollment number already exists
      const { data: existingEnrollment, error: enrollmentError } = await supabase
        .from('students')
        .select('id')
        .eq('enrollment_number', data.enrollmentNumber)
        .maybeSingle();
      
      if (enrollmentError) throw enrollmentError;
      if (existingEnrollment) {
        throw new Error(`Student with enrollment number ${data.enrollmentNumber} already exists.`);
      }
      
      // Check if student with this email already exists
      const { data: existingEmail, error: emailError } = await supabase
        .from('students')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();
      
      if (emailError) throw emailError;
      if (existingEmail) {
        throw new Error(`An account with email ${data.email} already exists.`);
      }

      // Generate ID for new student
      const studentId = crypto.randomUUID();
      
      // Create new student object for database
      const newStudent = {
        id: studentId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        role: "student",
        enrollment_number: data.enrollmentNumber,
        contact_number: data.phone,
        guardian_email: data.guardianEmail,
        department: data.college,
        course: data.course,
        branch: data.branch,
        semester: String(data.semester),
        section: data.section
      };
      
      // Insert student into database
      const { error } = await supabase
        .from('students')
        .insert(newStudent);
      
      if (error) throw error;

      // Create a student object for session storage (without password)
      const safeStudent = {
        id: studentId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role: "student" as UserRole,
        enrollmentNumber: data.enrollmentNumber,
        contactNumber: data.phone,
        guardianEmail: data.guardianEmail,
        department: data.college,
        course: data.course,
        branch: data.branch,
        semester: String(data.semester),
        section: data.section
      };

      // Set session variables and redirect to student dashboard
      sessionStorage.setItem("user", JSON.stringify(safeStudent));
      sessionStorage.setItem("userRole", "student");

      toast({
        title: "Registration successful!",
        description: "Your student account has been created.",
      });

      // Navigate to student dashboard
      setIsAuthSuccess(true);
      setTimeout(() => {
        navigate("/student");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMentorRegister = async (data: MentorRegistrationFormData) => {
    setIsSubmitting(true);

    try {
      // Check if mentor with this email already exists
      const { data: existingMentor, error: mentorError } = await supabase
        .from('mentors')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();
      
      if (mentorError) throw mentorError;
      if (existingMentor) {
        throw new Error(`A mentor account with email ${data.email} already exists.`);
      }

      // Generate ID for new mentor
      const mentorId = crypto.randomUUID();
      
      // Convert sections to array if it's not already
      const sectionsArray = Array.isArray(data.sections) 
        ? data.sections 
        : [data.sections];
      
      // Create new mentor object for database
      const newMentor = {
        id: mentorId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
        role: "mentor",
        contact_number: data.phone,
        department: data.department,
        branches: [data.branch],
        courses: [data.course],
        sections: sectionsArray,
        semesters: [data.semester]
      };
      
      // Insert mentor into database
      const { error } = await supabase
        .from('mentors')
        .insert(newMentor);
      
      if (error) throw error;

      // Create a mentor object for session storage (without password)
      const safeMentor = {
        id: mentorId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role: "mentor" as UserRole,
        contactNumber: data.phone,
        department: data.department,
        branches: [data.branch],
        courses: [data.course],
        sections: sectionsArray,
        semesters: [data.semester]
      };

      // Set session variables
      sessionStorage.setItem("user", JSON.stringify(safeMentor));
      sessionStorage.setItem("userRole", "mentor");

      toast({
        title: "Registration successful!",
        description: "Your mentor account has been created.",
      });

      // Navigate to mentor dashboard
      setIsAuthSuccess(true);
      setTimeout(() => {
        navigate("/mentor");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 mb-4 relative">
            <img
              src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
              alt="Amity University"
              className="w-full h-full object-contain animate-pulse"
            />
          </div>
          <div className="text-xl font-semibold text-gray-700">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/")}
              aria-label="Back to home"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center flex-grow">
              <div className="mx-auto w-16 h-16 mb-4 relative">
                <img
                  src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
                  alt="Amity University"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold font-display">Create an Account</h1>
              <p className="text-muted-foreground">
                Join our campus outpass system
              </p>
            </div>
            <div className="w-8"></div>
          </div>

          <Tabs defaultValue="student" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <form onSubmit={handleStudentSubmit(handleStudentRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-first-name">First Name</Label>
                  <Input
                    id="student-first-name"
                    type="text"
                    placeholder="Enter your first name"
                    {...registerStudent("firstName")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.firstName && (
                    <p className="text-sm text-red-500">{studentErrors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-last-name">Last Name</Label>
                  <Input
                    id="student-last-name"
                    type="text"
                    placeholder="Enter your last name"
                    {...registerStudent("lastName")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.lastName && (
                    <p className="text-sm text-red-500">{studentErrors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-email">Email Address</Label>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="name@example.com"
                    {...registerStudent("email")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.email && (
                    <p className="text-sm text-red-500">{studentErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <Input
                    id="student-password"
                    type="password"
                    {...registerStudent("password")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.password && (
                    <p className="text-sm text-red-500">{studentErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-confirm-password">Confirm Password</Label>
                  <Input
                    id="student-confirm-password"
                    type="password"
                    {...registerStudent("confirmPassword")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{studentErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-enrollment-number">Enrollment Number</Label>
                  <Input
                    id="student-enrollment-number"
                    type="text"
                    placeholder="e.g., A12345678"
                    {...registerStudent("enrollmentNumber")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.enrollmentNumber && (
                    <p className="text-sm text-red-500">{studentErrors.enrollmentNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-phone">Phone Number</Label>
                  <Input
                    id="student-phone"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    {...registerStudent("phone")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.phone && (
                    <p className="text-sm text-red-500">{studentErrors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-guardian-email">Guardian Email</Label>
                  <Input
                    id="student-guardian-email"
                    type="email"
                    placeholder="guardian@example.com"
                    {...registerStudent("guardianEmail")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.guardianEmail && (
                    <p className="text-sm text-red-500">{studentErrors.guardianEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-college">College</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASET" {...registerStudent("college")}>Amity School of Engineering and Technology</SelectItem>
                      <SelectItem value="ABS" {...registerStudent("college")}>Amity Business School</SelectItem>
                      <SelectItem value="ALS" {...registerStudent("college")}>Amity Law School</SelectItem>
                      <SelectItem value="ASFA" {...registerStudent("college")}>Amity School of Fine Arts</SelectItem>
                    </SelectContent>
                  </Select>
                  {studentErrors.college && (
                    <p className="text-sm text-red-500">{studentErrors.college.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-course">Course</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech" {...registerStudent("course")}>B.Tech</SelectItem>
                      <SelectItem value="MBA" {...registerStudent("course")}>MBA</SelectItem>
                      <SelectItem value="LLB" {...registerStudent("course")}>LLB</SelectItem>
                      <SelectItem value="BFA" {...registerStudent("course")}>BFA</SelectItem>
                    </SelectContent>
                  </Select>
                  {studentErrors.course && (
                    <p className="text-sm text-red-500">{studentErrors.course.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-branch">Branch</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSE" {...registerStudent("branch")}>Computer Science and Engineering</SelectItem>
                      <SelectItem value="ECE" {...registerStudent("branch")}>Electronics and Communication Engineering</SelectItem>
                      <SelectItem value="ME" {...registerStudent("branch")}>Mechanical Engineering</SelectItem>
                      <SelectItem value="LAW" {...registerStudent("branch")}>Law</SelectItem>
                    </SelectContent>
                  </Select>
                  {studentErrors.branch && (
                    <p className="text-sm text-red-500">{studentErrors.branch.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-semester">Semester</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={1} {...registerStudent("semester", { valueAsNumber: true })}>1st Semester</SelectItem>
                      <SelectItem value={2} {...registerStudent("semester", { valueAsNumber: true })}>2nd Semester</SelectItem>
                      <SelectItem value={3} {...registerStudent("semester", { valueAsNumber: true })}>3rd Semester</SelectItem>
                      <SelectItem value={4} {...registerStudent("semester", { valueAsNumber: true })}>4th Semester</SelectItem>
                      <SelectItem value={5} {...registerStudent("semester", { valueAsNumber: true })}>5th Semester</SelectItem>
                      <SelectItem value={6} {...registerStudent("semester", { valueAsNumber: true })}>6th Semester</SelectItem>
                      <SelectItem value={7} {...registerStudent("semester", { valueAsNumber: true })}>7th Semester</SelectItem>
                      <SelectItem value={8} {...registerStudent("semester", { valueAsNumber: true })}>8th Semester</SelectItem>
                    </SelectContent>
                  </Select>
                  {studentErrors.semester && (
                    <p className="text-sm text-red-500">{studentErrors.semester.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-section">Section</Label>
                  <Input
                    id="student-section"
                    type="text"
                    placeholder="Enter your section"
                    {...registerStudent("section")}
                    disabled={isSubmitting}
                  />
                  {studentErrors.section && (
                    <p className="text-sm text-red-500">{studentErrors.section.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register as Student"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="mentor">
              <form onSubmit={handleMentorSubmit(handleMentorRegister)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentor-first-name">First Name</Label>
                  <Input
                    id="mentor-first-name"
                    type="text"
                    placeholder="Enter your first name"
                    {...registerMentor("firstName")}
                    disabled={isSubmitting}
                  />
                  {mentorErrors.firstName && (
                    <p className="text-sm text-red-500">{mentorErrors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-last-name">Last Name</Label>
                  <Input
                    id="mentor-last-name"
                    type="text"
                    placeholder="Enter your last name"
                    {...registerMentor("lastName")}
                    disabled={isSubmitting}
                  />
                  {mentorErrors.lastName && (
                    <p className="text-sm text-red-500">{mentorErrors.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-email">Email Address</Label>
                  <Input
                    id="mentor-email"
                    type="email"
                    placeholder="name@amity.edu"
                    {...registerMentor("email")}
                    disabled={isSubmitting}
                  />
                  {mentorErrors.email && (
                    <p className="text-sm text-red-500">{mentorErrors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-password">Password</Label>
                  <Input
                    id="mentor-password"
                    type="password"
                    {...registerMentor("password")}
                    disabled={isSubmitting}
                  />
                  {mentorErrors.password && (
                    <p className="text-sm text-red-500">{mentorErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-confirm-password">Confirm Password</Label>
                  <Input
                    id="mentor-confirm-password"
                    type="password"
                    {...registerMentor("confirmPassword")}
                    disabled={isSubmitting}
                  />
                  {mentorErrors.confirmPassword && (
                    <p className="text-sm text-red-500">{mentorErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-phone">Phone Number</Label>
                  <Input
                    id="mentor-phone"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    {...registerMentor("phone")}
                    disabled={isSubmitting}
                  />
                  {mentorErrors.phone && (
                    <p className="text-sm text-red-500">{mentorErrors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-department">Department</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASET" {...registerMentor("department")}>Amity School of Engineering and Technology</SelectItem>
                      <SelectItem value="ABS" {...registerMentor("department")}>Amity Business School</SelectItem>
                      <SelectItem value="ALS" {...registerMentor("department")}>Amity Law School</SelectItem>
                      <SelectItem value="ASFA" {...registerMentor("department")}>Amity School of Fine Arts</SelectItem>
                    </SelectContent>
                  </Select>
                  {mentorErrors.department && (
                    <p className="text-sm text-red-500">{mentorErrors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-branch">Branch</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSE" {...registerMentor("branch")}>Computer Science and Engineering</SelectItem>
                      <SelectItem value="ECE" {...registerMentor("branch")}>Electronics and Communication Engineering</SelectItem>
                      <SelectItem value="ME" {...registerMentor("branch")}>Mechanical Engineering</SelectItem>
                      <SelectItem value="LAW" {...registerMentor("branch")}>Law</SelectItem>
                    </SelectContent>
                  </Select>
                  {mentorErrors.branch && (
                    <p className="text-sm text-red-500">{mentorErrors.branch.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-course">Course</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech" {...registerMentor("course")}>B.Tech</SelectItem>
                      <SelectItem value="MBA" {...registerMentor("course")}>MBA</SelectItem>
                      <SelectItem value="LLB" {...registerMentor("course")}>LLB</SelectItem>
                      <SelectItem value="BFA" {...registerMentor("course")}>BFA</SelectItem>
                    </SelectContent>
                  </Select>
                  {mentorErrors.course && (
                    <p className="text-sm text-red-500">{mentorErrors.course.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-semester">Semester</Label>
                  <Select disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" {...registerMentor("semester")}>1st Semester</SelectItem>
                      <SelectItem value="2" {...registerMentor("semester")}>2nd Semester</SelectItem>
                      <SelectItem value="3" {...registerMentor("semester")}>3rd Semester</SelectItem>
                      <SelectItem value="4" {...registerMentor("semester")}>4th Semester</SelectItem>
                      <SelectItem value="5" {...registerMentor("semester")}>5th Semester</SelectItem>
                      <SelectItem value="6" {...registerMentor("semester")}>6th Semester</SelectItem>
                      <SelectItem value="7" {...registerMentor("semester")}>7th Semester</SelectItem>
                      <SelectItem value="8" {...registerMentor("semester")}>8th Semester</SelectItem>
                    </SelectContent>
                  </Select>
                  {mentorErrors.semester && (
                    <p className="text-sm text-red-500">{mentorErrors.semester.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mentor-sections">Sections</Label>
                  <Select multiple disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A" {...registerMentor("sections")}>Section A</SelectItem>
                      <SelectItem value="B" {...registerMentor("sections")}>Section B</SelectItem>
                      <SelectItem value="C" {...registerMentor("sections")}>Section C</SelectItem>
                      <SelectItem value="D" {...registerMentor("sections")}>Section D</SelectItem>
                    </SelectContent>
                  </Select>
                  {mentorErrors.sections && (
                    <p className="text-sm text-red-500">{mentorErrors.sections.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register as Mentor"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
