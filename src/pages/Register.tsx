
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { UserRole, Student, Mentor } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);
  
  // Error dialogs
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState("");
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  
  // Student form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentEnrollment, setStudentEnrollment] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [studentGuardianEmail, setStudentGuardianEmail] = useState(""); // Changed from guardianNumber to guardianEmail
  const [studentDepartment, setStudentDepartment] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [studentBranch, setStudentBranch] = useState("");
  const [studentSemester, setStudentSemester] = useState("");
  const [studentSection, setStudentSection] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  
  // Mentor form state
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorContactNumber, setMentorContactNumber] = useState(""); // Added contact number for mentors
  const [mentorDepartment, setMentorDepartment] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");
  const [mentorConfirmPassword, setMentorConfirmPassword] = useState("");
  
  // Mentor additional dynamic fields
  const [mentorBranches, setMentorBranches] = useState<string[]>(["Computer Science"]);
  const [mentorCourses, setMentorCourses] = useState<string[]>(["B.Tech"]);
  const [mentorSemesters, setMentorSemesters] = useState<string[]>([]);
  const [mentorSections, setMentorSections] = useState<string[]>([]);
  const [mentorSemesterInput, setMentorSemesterInput] = useState("");
  const [mentorSectionInput, setMentorSectionInput] = useState("");
  
  // Department options based on the new requirements
  const departmentOptions = [
    "ASET", "ABS", "AIB", "AIBP", "AIP", "ALS", "AIBA", "ASCo", "ASFT", "AIS"
  ];

  // Handle successful authentication and navigation with page reload
  useEffect(() => {
    if (isAuthSuccess) {
      const userRole = sessionStorage.getItem("userRole") as UserRole;
      
      // Short delay for transition effect before reloading
      const timer = setTimeout(() => {
        // Set a flag in sessionStorage to indicate where to navigate after reload
        sessionStorage.setItem("redirectAfterReload", userRole === "student" ? "/student" : "/mentor");
        
        // Force a full page reload
        window.location.reload();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthSuccess]);

  // Check if user is already authenticated or if there's a pending redirect
  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole") as UserRole;
    const user = sessionStorage.getItem("user");
    const redirectPath = sessionStorage.getItem("redirectAfterReload");
    
    if (redirectPath) {
      // Clear the redirect flag
      sessionStorage.removeItem("redirectAfterReload");
      
      // Navigate to the saved path
      window.location.href = redirectPath;
      return;
    }
    
    if (user && userRole) {
      // User is already authenticated, redirect immediately
      if (userRole === "student") {
        navigate("/student", { replace: true });
      } else if (userRole === "mentor") {
        navigate("/mentor", { replace: true });
      }
    }
  }, [navigate]);
  
  const handleSectionToggle = (section: string) => {
    setMentorSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };
  
  const handleBranchToggle = (branch: string) => {
    setMentorBranches(prev => 
      prev.includes(branch) 
        ? prev.filter(b => b !== branch) 
        : [...prev, branch]
    );
  };
  
  const handleCourseToggle = (course: string) => {
    setMentorCourses(prev => 
      prev.includes(course) 
        ? prev.filter(c => c !== course) 
        : [...prev, course]
    );
  };

  const handleAddMentorSection = () => {
    if (mentorSectionInput && !mentorSections.includes(mentorSectionInput)) {
      setMentorSections([...mentorSections, mentorSectionInput]);
      setMentorSectionInput("");
    }
  };

  const handleAddMentorSemester = () => {
    if (mentorSemesterInput && !mentorSemesters.includes(mentorSemesterInput)) {
      setMentorSemesters([...mentorSemesters, mentorSemesterInput]);
      setMentorSemesterInput("");
    }
  };

  const removeMentorSection = (section: string) => {
    setMentorSections(mentorSections.filter(s => s !== section));
  };

  const removeMentorSemester = (semester: string) => {
    setMentorSemesters(mentorSemesters.filter(s => s !== semester));
  };
  
  // Function to check if enrollment number is already registered
  const isEnrollmentRegistered = (enrollmentNumber: string): boolean => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      return existingUsers.some((user: any) => 
        user.role === "student" && 
        user.enrollmentNumber && 
        user.enrollmentNumber.toLowerCase() === enrollmentNumber.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking enrollment:", error);
      return false;
    }
  };
  
  // Function to check if email is already registered
  const isEmailRegistered = (email: string): boolean => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      return existingUsers.some((user: any) => 
        user.email && 
        user.email.toLowerCase() === email.toLowerCase()
      );
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };
  
  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!studentName || !studentEmail || !studentEnrollment || !studentContact || 
        !studentGuardianEmail || !studentDepartment || !studentCourse || 
        !studentBranch || !studentSemester || !studentSection || 
        !studentPassword || !studentConfirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format for guardian email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentGuardianEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid guardian email address",
        variant: "destructive",
      });
      return;
    }
    
    if (studentPassword !== studentConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (studentPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    // Check if enrollment number is already registered
    if (isEnrollmentRegistered(studentEnrollment)) {
      setErrorDialogTitle("Enrollment Number Already Registered");
      setErrorDialogMessage("This enrollment number is already registered. Please use a different enrollment number or login to your existing account.");
      setShowErrorDialog(true);
      return;
    }
    
    // Check if email is already registered
    if (isEmailRegistered(studentEmail)) {
      setErrorDialogTitle("Email Already Registered");
      setErrorDialogMessage("This email is already registered. Please use a different email or login to your existing account.");
      setShowErrorDialog(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create student user
      const studentUser: Student & { password: string } = {
        id: generateId(),
        name: studentName,
        email: studentEmail,
        password: studentPassword, // Store password for login authentication
        role: "student",
        enrollmentNumber: studentEnrollment,
        contactNumber: studentContact,
        guardianEmail: studentGuardianEmail, // Changed from guardianNumber to guardianEmail
        department: studentDepartment,
        course: studentCourse,
        branch: studentBranch,
        semester: studentSemester,
        section: studentSection,
      };
      
      // Store in users collection in localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      localStorage.setItem("users", JSON.stringify([...existingUsers, studentUser]));
      
      // Create a safe student object without password for session storage
      const safeStudent = { ...studentUser };
      delete (safeStudent as any).password;
      
      // Also store in sessionStorage for immediate login
      sessionStorage.setItem("user", JSON.stringify(safeStudent));
      sessionStorage.setItem("userRole", "student");
      
      // Initialize outpass data if not exists
      if (!localStorage.getItem("outpasses")) {
        localStorage.setItem("outpasses", JSON.stringify([]));
      }
      
      toast({
        title: "Success!",
        description: "Your student account has been created",
      });
      
      // Set authentication success
      setIsAuthSuccess(true);
    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    }
  };
  
  const handleMentorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!mentorName || !mentorEmail || !mentorContactNumber || !mentorDepartment || 
        !mentorPassword || !mentorConfirmPassword || 
        mentorSections.length === 0 || mentorSemesters.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and add at least one section and semester",
        variant: "destructive",
      });
      return;
    }
    
    if (mentorPassword !== mentorConfirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (mentorPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    // Check if email is already registered
    if (isEmailRegistered(mentorEmail)) {
      setErrorDialogTitle("Email Already Registered");
      setErrorDialogMessage("This email is already registered. Please use a different email or login to your existing account.");
      setShowErrorDialog(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create mentor user with dynamic values
      const mentorUser: Mentor & { password: string } = {
        id: generateId(),
        name: mentorName,
        email: mentorEmail,
        password: mentorPassword, // Store password for login authentication
        role: "mentor",
        contactNumber: mentorContactNumber, // Added contact number for mentors
        department: mentorDepartment,
        branches: mentorBranches,
        courses: mentorCourses,
        semesters: mentorSemesters,
        sections: mentorSections,
      };
      
      // Store in users collection in localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      localStorage.setItem("users", JSON.stringify([...existingUsers, mentorUser]));
      
      // Create a safe mentor object without password for session storage
      const safeMentor = { ...mentorUser };
      delete (safeMentor as any).password;
      
      // Also store in sessionStorage for immediate login
      sessionStorage.setItem("user", JSON.stringify(safeMentor));
      sessionStorage.setItem("userRole", "mentor");
      
      // Initialize outpass data if not exists
      if (!localStorage.getItem("outpasses")) {
        localStorage.setItem("outpasses", JSON.stringify([]));
      }
      
      toast({
        title: "Success!",
        description: "Your mentor account has been created",
      });
      
      // Set authentication success
      setIsAuthSuccess(true);
    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
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
          <div className="text-xl font-semibold text-gray-700">Creating your account...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8">
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
              <h1 className="text-2xl font-bold font-display">Create an AmiPass Account</h1>
              <p className="text-muted-foreground">
                Register for the campus outpass management system
              </p>
            </div>
            <div className="w-8"></div>
          </div>
          
          <Tabs defaultValue="student" value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Important Note</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Please enter your details carefully and verify before submitting. Your information cannot be modified after registration.
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleStudentRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Full Name</Label>
                    <Input
                      id="student-name"
                      placeholder="Name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email Address</Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="eg. abc@gmail.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-enrollment">Enrollment Number</Label>
                    <Input
                      id="student-enrollment"
                      placeholder="e.g., A60205222013"
                      value={studentEnrollment}
                      onChange={(e) => setStudentEnrollment(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-contact">Contact Number (+91)</Label>
                    <Input
                      id="student-contact"
                      placeholder="+91"
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="student-guardian-email">Guardian Email Address</Label>
                  <Input
                    id="student-guardian-email"
                    type="email"
                    placeholder="guardian_email@gmail.comm"
                    value={studentGuardianEmail}
                    onChange={(e) => setStudentGuardianEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-department">Department</Label>
                    <Select 
                      value={studentDepartment} 
                      onValueChange={setStudentDepartment}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="student-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-course">Course</Label>
                    <Select 
                      value={studentCourse} 
                      onValueChange={setStudentCourse}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="student-course">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B.Tech">B.Tech</SelectItem>
                        <SelectItem value="M.Tech">M.Tech</SelectItem>
                        <SelectItem value="BCA">BCA</SelectItem>
                        <SelectItem value="MCA">MCA</SelectItem>
                        <SelectItem value="B.Sc">B.Sc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-branch">Branch</Label>
                    <Select 
                      value={studentBranch} 
                      onValueChange={setStudentBranch}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="student-branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-semester">Semester</Label>
                    <Input
                      id="student-semester"
                      placeholder="e.g., 1"
                      value={studentSemester}
                      onChange={(e) => setStudentSemester(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-section">Section (in uppercase)</Label>
                    <Input
                      id="student-section"
                      placeholder="e.g., A"
                      value={studentSection}
                      onChange={(e) => setStudentSection(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-confirm-password">Confirm Password</Label>
                    <Input
                      id="student-confirm-password"
                      type="password"
                      value={studentConfirmPassword}
                      onChange={(e) => setStudentConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Register as Student"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="mentor">
              <form onSubmit={handleMentorRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentor-name">Full Name</Label>
                  <Input
                    id="mentor-name"
                    placeholder="Dr. Jane Smith"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mentor-email">Email Address</Label>
                    <Input
                      id="mentor-email"
                      type="email"
                      placeholder="eg. abc@amity.edu"
                      value={mentorEmail}
                      onChange={(e) => setMentorEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mentor-contact">Contact Number (+91)</Label>
                    <Input
                      id="mentor-contact"
                      placeholder="+91"
                      value={mentorContactNumber}
                      onChange={(e) => setMentorContactNumber(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mentor-department">Department</Label>
                  <Select 
                    value={mentorDepartment} 
                    onValueChange={setMentorDepartment}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="mentor-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sections You Mentor</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter section (e.g., A)"
                        value={mentorSectionInput}
                        onChange={(e) => setMentorSectionInput(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddMentorSection} 
                        disabled={isLoading || !mentorSectionInput}
                        className="whitespace-nowrap"
                      >
                        Add Section
                      </Button>
                    </div>
                    
                    {mentorSections.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentorSections.map(section => (
                          <div key={section} className="bg-muted rounded-md px-3 py-1 text-sm flex items-center gap-1">
                            <span>Section {section}</span>
                            <button 
                              type="button" 
                              onClick={() => removeMentorSection(section)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Semesters You Handle</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter semester (e.g., 1)"
                        value={mentorSemesterInput}
                        onChange={(e) => setMentorSemesterInput(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button 
                        type="button" 
                        onClick={handleAddMentorSemester} 
                        disabled={isLoading || !mentorSemesterInput}
                        className="whitespace-nowrap"
                      >
                        Add Semester
                      </Button>
                    </div>
                    
                    {mentorSemesters.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mentorSemesters.map(semester => (
                          <div key={semester} className="bg-muted rounded-md px-3 py-1 text-sm flex items-center gap-1">
                            <span>Semester {semester}</span>
                            <button 
                              type="button" 
                              onClick={() => removeMentorSemester(semester)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Branches You Handle</Label>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    {["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"].map(branch => (
                      <div key={branch} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`branch-${branch}`}
                          checked={mentorBranches.includes(branch)}
                          onCheckedChange={() => handleBranchToggle(branch)}
                        />
                        <label 
                          htmlFor={`branch-${branch}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {branch}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Courses You Teach</Label>
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    {["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc"].map(course => (
                      <div key={course} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`course-${course}`}
                          checked={mentorCourses.includes(course)}
                          onCheckedChange={() => handleCourseToggle(course)}
                        />
                        <label 
                          htmlFor={`course-${course}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {course}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mentor-password">Password</Label>
                    <Input
                      id="mentor-password"
                      type="password"
                      value={mentorPassword}
                      onChange={(e) => setMentorPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mentor-confirm-password">Confirm Password</Label>
                    <Input
                      id="mentor-confirm-password"
                      type="password"
                      value={mentorConfirmPassword}
                      onChange={(e) => setMentorConfirmPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
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

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {errorDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {errorDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
