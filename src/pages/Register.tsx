import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/lib/types";

export default function Register() {
  const [activeTab, setActiveTab] = useState<"student" | "mentor">("student");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  // Student registration form state
  const [studentName, setStudentName] = useState("");
  const [studentEnrollment, setStudentEnrollment] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentContactNumber, setStudentContactNumber] = useState("");
  const [studentGuardianEmail, setStudentGuardianEmail] = useState("");
  const [studentDepartment, setStudentDepartment] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [studentBranch, setStudentBranch] = useState("");
  const [studentSemester, setStudentSemester] = useState("");
  const [studentSection, setStudentSection] = useState("");
  
  // Mentor registration form state
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");
  const [mentorContactNumber, setMentorContactNumber] = useState("");
  const [mentorDepartment, setMentorDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedSection, setSelectedSection] = useState("");
  
  // Department options
  const departmentOptions = [
    "ASET", // Amity School of Engineering & Technology
    "ABS", // Amity Business School
    "ASAP", // Amity School of Applied Sciences
    "ASCO", // Amity School of Communication
    "ASFT", // Amity School of Fashion Technology
    "ASFA", // Amity School of Fine Arts
  ];
  
  // Course options based on department
  const courseOptions: Record<string, string[]> = {
    "ASET": ["B.Tech", "M.Tech", "Ph.D"],
    "ABS": ["BBA", "MBA", "Ph.D"],
    "ASAP": ["BSc", "MSc", "Ph.D"],
    "ASCO": ["BA(JMC)", "MA(JMC)", "Ph.D"],
    "ASFT": ["B.Des", "M.Des", "Ph.D"],
    "ASFA": ["BFA", "MFA", "Ph.D"],
  };
  
  // Branch options based on course and department
  const branchOptions: Record<string, Record<string, string[]>> = {
    "ASET": {
      "B.Tech": ["CSE", "ECE", "ME", "CE", "EEE"],
      "M.Tech": ["CSE", "ECE", "ME", "CE", "EEE"],
      "Ph.D": ["Engineering"],
    },
    "ABS": {
      "BBA": ["General", "Marketing", "Finance", "HR"],
      "MBA": ["General", "Marketing", "Finance", "HR"],
      "Ph.D": ["Management"],
    },
    "ASAP": {
      "BSc": ["Physics", "Chemistry", "Mathematics", "Computer Science"],
      "MSc": ["Physics", "Chemistry", "Mathematics", "Computer Science"],
      "Ph.D": ["Science"],
    },
    "ASCO": {
      "BA(JMC)": ["Journalism", "Mass Communication"],
      "MA(JMC)": ["Journalism", "Mass Communication"],
      "Ph.D": ["Communication"],
    },
    "ASFT": {
      "B.Des": ["Fashion Design", "Textile Design"],
      "M.Des": ["Fashion Design", "Textile Design"],
      "Ph.D": ["Design"],
    },
    "ASFA": {
      "BFA": ["Painting", "Sculpture", "Applied Arts"],
      "MFA": ["Painting", "Sculpture", "Applied Arts"],
      "Ph.D": ["Fine Arts"],
    },
  };

  // Input validation functions with enhanced error messaging
  const validateEnrollmentNumber = (value: string): string => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (cleaned.length === 0) return '';
    
    const firstChar = cleaned[0];
    const restChars = cleaned.slice(1);
    
    if (/[A-Z]/.test(firstChar)) {
      const digitsOnly = restChars.replace(/[^0-9]/g, '');
      const result = firstChar + digitsOnly;
      
      // Show error if format is violated
      if (value !== result && value.length > 0) {
        toast.error("Enrollment number must start with a capital letter followed by digits only");
      }
      
      return result;
    }
    
    if (value.length > 0) {
      toast.error("Enrollment number must start with a capital letter");
    }
    
    return '';
  };

  const validateContactNumber = (value: string): string => {
    const digits = value.replace(/[^0-9]/g, '');
    const result = digits.slice(0, 10);
    
    // Show error if non-digit characters were entered
    if (value !== result && value.length > 0) {
      toast.error("Contact number must contain only digits");
    }
    
    // Show error if trying to enter more than 10 digits
    if (digits.length > 10) {
      toast.error("Contact number must be exactly 10 digits");
    }
    
    return result;
  };

  const validateSemester = (value: string): string => {
    const digits = value.replace(/[^0-9]/g, '');
    const num = parseInt(digits);
    
    if (digits.length === 0) return '';
    
    if (isNaN(num) || num < 1 || num > 10) {
      if (value.length > 0) {
        toast.error("Semester must be between 1 and 10");
      }
      return '';
    }
    
    // Show error if non-digit characters were entered
    if (value !== digits && value.length > 0) {
      toast.error("Semester must be a number between 1 and 10");
    }
    
    return digits;
  };

  const validateSection = (value: string): string => {
    const upperCase = value.toUpperCase();
    const letter = upperCase.replace(/[^A-Z]/g, '');
    const result = letter.slice(0, 1);
    
    // Show error if non-letter characters were entered
    if (value !== result && value.length > 0) {
      toast.error("Section must be a single uppercase letter");
    }
    
    return result;
  };
  
  // Handle student registration
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form fields
      if (!studentName || !studentEnrollment || !studentEmail || !studentPassword) {
        toast.error("Please fill all required fields");
        setIsLoading(false);
        return;
      }

      // Additional validation for formatted fields
      if (studentEnrollment && !/^[A-Z][0-9]+$/.test(studentEnrollment)) {
        toast.error("Enrollment number must start with a capital letter followed by digits");
        setIsLoading(false);
        return;
      }

      if (studentContactNumber && (studentContactNumber.length !== 10 || !/^[0-9]+$/.test(studentContactNumber))) {
        toast.error("Contact number must be exactly 10 digits");
        setIsLoading(false);
        return;
      }

      if (studentSemester && (!/^[1-9]|10$/.test(studentSemester))) {
        toast.error("Semester must be between 1 and 10");
        setIsLoading(false);
        return;
      }

      if (studentSection && !/^[A-Z]$/.test(studentSection)) {
        toast.error("Section must be a single uppercase letter");
        setIsLoading(false);
        return;
      }
      
      // Check if student with this email or enrollment already exists
      const { data: existingUsers, error: fetchError } = await supabase
        .from("students")
        .select("id")
        .or(`email.eq.${studentEmail},enrollment_number.eq.${studentEnrollment}`);
      
      if (fetchError) throw fetchError;
      
      if (existingUsers && existingUsers.length > 0) {
        toast.error("A student with this email or enrollment number already exists");
        setIsLoading(false);
        return;
      }
      
      // Create new student object
      const newStudent = {
        id: crypto.randomUUID(),
        name: studentName,
        email: studentEmail,
        password: studentPassword,
        role: 'student' as UserRole,
        enrollment_number: studentEnrollment,
        contact_number: studentContactNumber,
        guardian_email: studentGuardianEmail,
        department: studentDepartment,
        course: studentCourse,
        branch: studentBranch,
        semester: studentSemester,
        section: studentSection,
      };
      
      // Insert student into database
      const { error } = await supabase
        .from("students")
        .insert(newStudent);
      
      if (error) throw error;
      
      // Registration successful
      toast.success("Registration successful! Please login");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle mentor registration with improved validation
  const handleMentorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form fields
      if (!mentorName || !mentorEmail || !mentorPassword) {
        toast.error("Please fill all required fields");
        setIsLoading(false);
        return;
      }

      // Additional validation for formatted fields
      if (mentorContactNumber && (mentorContactNumber.length !== 10 || !/^[0-9]+$/.test(mentorContactNumber))) {
        toast.error("Contact number must be exactly 10 digits");
        setIsLoading(false);
        return;
      }

      if (selectedSemester && (!/^[1-9]|10$/.test(selectedSemester))) {
        toast.error("Semester must be between 1 and 10");
        setIsLoading(false);
        return;
      }

      if (selectedSection && !/^[A-Z]$/.test(selectedSection)) {
        toast.error("Section must be a single uppercase letter");
        setIsLoading(false);
        return;
      }
      
      // Check if mentor with this email already exists
      const { data: existingUsers, error: fetchError } = await supabase
        .from("mentors")
        .select("id")
        .eq("email", mentorEmail);
      
      if (fetchError) throw fetchError;
      
      if (existingUsers && existingUsers.length > 0) {
        toast.error("A mentor with this email already exists");
        setIsLoading(false);
        return;
      }
      
      // Create new mentor object
      const newMentor = {
        id: crypto.randomUUID(),
        name: mentorName,
        email: mentorEmail,
        password: mentorPassword,
        role: 'mentor' as UserRole,
        contact_number: mentorContactNumber,
        department: mentorDepartment,
        branches: selectedBranches,
        courses: selectedCourses,
        sections: selectedSection ? [selectedSection] : [],
        semesters: selectedSemester ? [selectedSemester] : [],
      };
      
      // Insert mentor into database
      const { error } = await supabase
        .from("mentors")
        .insert(newMentor);
      
      if (error) throw error;
      
      // Registration successful
      toast.success("Registration successful! Please login");
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "student" | "mentor");
  };
  
  // Filter available courses based on selected department
  const availableCourses = studentDepartment ? courseOptions[studentDepartment] || [] : [];
  
  // Filter available branches based on selected department and course
  const availableBranches = studentDepartment && studentCourse ? 
    branchOptions[studentDepartment]?.[studentCourse] || [] : [];
  
  // Function to toggle selection in multi-select
  const toggleSelection = (value: string, currentSelections: string[], setSelections: (selections: string[]) => void) => {
    if (currentSelections.includes(value)) {
      setSelections(currentSelections.filter(item => item !== value));
    } else {
      setSelections([...currentSelections, value]);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 mb-4">
            <img
              src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
              alt="Amity University"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold font-display">
            Amity University, Madhya Pradesh
          </h1>
          <p className="text-gray-500 mt-1">Register for Outpass System</p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <form onSubmit={handleStudentRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Full Name</Label>
                  <Input
                    id="studentName"
                    placeholder="Enter your full name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentEnrollment">Enrollment Number</Label>
                  <Input
                    id="studentEnrollment"
                    placeholder="e.g., A12345678901"
                    value={studentEnrollment}
                    onChange={(e) => setStudentEnrollment(validateEnrollmentNumber(e.target.value))}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Password</Label>
                  <Input
                    id="studentPassword"
                    type="password"
                    placeholder="Create a password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentContact">Contact Number</Label>
                  <Input
                    id="studentContact"
                    placeholder="Your mobile number"
                    value={studentContactNumber}
                    onChange={(e) => setStudentContactNumber(validateContactNumber(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentGuardianEmail">Guardian Email</Label>
                  <Input
                    id="studentGuardianEmail"
                    placeholder="Guardian's email address"
                    value={studentGuardianEmail}
                    onChange={(e) => setStudentGuardianEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentDepartment">Department</Label>
                  <Select value={studentDepartment} onValueChange={setStudentDepartment} disabled={isLoading}>
                    <SelectTrigger id="studentDepartment">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentCourse">Course</Label>
                  <Select 
                    value={studentCourse} 
                    onValueChange={setStudentCourse} 
                    disabled={isLoading || !studentDepartment}
                  >
                    <SelectTrigger id="studentCourse">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentBranch">Branch</Label>
                  <Select 
                    value={studentBranch} 
                    onValueChange={setStudentBranch} 
                    disabled={isLoading || !studentDepartment || !studentCourse}
                  >
                    <SelectTrigger id="studentBranch">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBranches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentSemester">Semester</Label>
                    <Input
                      id="studentSemester"
                      placeholder="Enter your semester (1-10)"
                      value={studentSemester}
                      onChange={(e) => setStudentSemester(validateSemester(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="studentSection">Section</Label>
                    <Input
                      id="studentSection"
                      placeholder="Enter your section (A-Z)"
                      value={studentSection}
                      onChange={(e) => setStudentSection(validateSection(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
                  
                  <div className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 hover:underline">
                      Login instead
                    </a>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="mentor">
              <form onSubmit={handleMentorRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentorName">Full Name</Label>
                  <Input
                    id="mentorName"
                    placeholder="Enter your full name"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mentorEmail">Email</Label>
                  <Input
                    id="mentorEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mentorPassword">Password</Label>
                  <Input
                    id="mentorPassword"
                    type="password"
                    placeholder="Create a password"
                    value={mentorPassword}
                    onChange={(e) => setMentorPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mentorContact">Contact Number</Label>
                  <Input
                    id="mentorContact"
                    placeholder="Your mobile number"
                    value={mentorContactNumber}
                    onChange={(e) => setMentorContactNumber(validateContactNumber(e.target.value))}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mentorDepartment">Department</Label>
                  <Select value={mentorDepartment} onValueChange={setMentorDepartment} disabled={isLoading}>
                    <SelectTrigger id="mentorDepartment">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Courses (Select multiple)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(courseOptions)
                      .flat()
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .map((course) => (
                        <div key={course} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`course-${course}`}
                            checked={selectedCourses.includes(course)}
                            onChange={() => toggleSelection(course, selectedCourses, setSelectedCourses)}
                            disabled={isLoading}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`course-${course}`} className="text-sm">
                            {course}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Branches (Select multiple)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(branchOptions)
                      .flatMap((courses) => Object.values(courses).flat())
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .map((branch) => (
                        <div key={branch} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`branch-${branch}`}
                            checked={selectedBranches.includes(branch)}
                            onChange={() => toggleSelection(branch, selectedBranches, setSelectedBranches)}
                            disabled={isLoading}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`branch-${branch}`} className="text-sm">
                            {branch}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mentorSemester">Semester</Label>
                    <Input
                      id="mentorSemester"
                      placeholder="Enter semester (1-10)"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(validateSemester(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mentorSection">Section</Label>
                    <Input
                      id="mentorSection"
                      placeholder="Enter section (A-Z)"
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(validateSection(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                  </Button>
                  
                  <div className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 hover:underline">
                      Login instead
                    </a>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
