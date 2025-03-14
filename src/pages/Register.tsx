
import { useState } from "react";
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
import { Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthSuccess, setIsAuthSuccess] = useState(false);
  
  // Student form state
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentEnrollment, setStudentEnrollment] = useState("");
  const [studentContact, setStudentContact] = useState("");
  const [studentGuardianContact, setStudentGuardianContact] = useState("");
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
  const [mentorDepartment, setMentorDepartment] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");
  const [mentorConfirmPassword, setMentorConfirmPassword] = useState("");
  const [mentorSections, setMentorSections] = useState<string[]>(["A"]);
  
  // Mentor additional dynamic fields
  const [mentorBranches, setMentorBranches] = useState<string[]>(["Computer Science"]);
  const [mentorCourses, setMentorCourses] = useState<string[]>(["B.Tech"]);
  const [mentorSemesters, setMentorSemesters] = useState<string[]>(["1"]);
  
  // Department options based on the new requirements
  const departmentOptions = [
    "ASET", "ABS", "AIB", "AIBP", "AIP", "ALS", "AIBA", "ASCo", "ASFT", "AIS"
  ];
  
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
  
  const handleSemesterToggle = (semester: string) => {
    setMentorSemesters(prev => 
      prev.includes(semester) 
        ? prev.filter(s => s !== semester) 
        : [...prev, semester]
    );
  };
  
  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!studentName || !studentEmail || !studentEnrollment || !studentContact || 
        !studentGuardianContact || !studentDepartment || !studentCourse || 
        !studentBranch || !studentSemester || !studentSection || 
        !studentPassword || !studentConfirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
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
    
    setIsLoading(true);
    
    try {
      // Create student user
      const studentUser: Student = {
        id: generateId(),
        name: studentName,
        email: studentEmail,
        password: studentPassword, // Store password for login authentication
        role: "student",
        enrollmentNumber: studentEnrollment,
        contactNumber: studentContact,
        guardianNumber: studentGuardianContact,
        department: studentDepartment,
        course: studentCourse,
        branch: studentBranch,
        semester: studentSemester,
        section: studentSection,
      };
      
      // Store in users collection in localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      localStorage.setItem("users", JSON.stringify([...existingUsers, studentUser]));
      
      // Also store in current user
      localStorage.setItem("user", JSON.stringify(studentUser));
      localStorage.setItem("userRole", "student");
      
      // Initialize outpass data if not exists
      if (!localStorage.getItem("outpasses")) {
        localStorage.setItem("outpasses", JSON.stringify([]));
      }
      
      toast({
        title: "Success!",
        description: "Your student account has been created",
      });
      
      // Show animation before redirect
      setIsAuthSuccess(true);
      
      // Navigate immediately - the animation will overlay during navigation
      navigate("/student", { replace: true });
    } catch (error) {
      setIsLoading(false);
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
    if (!mentorName || !mentorEmail || !mentorDepartment || !mentorPassword || !mentorConfirmPassword || mentorSections.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one section",
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
    
    setIsLoading(true);
    
    try {
      // Create mentor user with dynamic values
      const mentorUser: Mentor = {
        id: generateId(),
        name: mentorName,
        email: mentorEmail,
        password: mentorPassword, // Store password for login authentication
        role: "mentor",
        department: mentorDepartment,
        branches: mentorBranches,
        courses: mentorCourses,
        semesters: mentorSemesters,
        sections: mentorSections,
      };
      
      // Store in users collection in localStorage
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      localStorage.setItem("users", JSON.stringify([...existingUsers, mentorUser]));
      
      // Also store in current user
      localStorage.setItem("user", JSON.stringify(mentorUser));
      localStorage.setItem("userRole", "mentor");
      
      // Initialize outpass data if not exists
      if (!localStorage.getItem("outpasses")) {
        localStorage.setItem("outpasses", JSON.stringify([]));
      }
      
      toast({
        title: "Success!",
        description: "Your mentor account has been created",
      });
      
      // Show animation before redirect
      setIsAuthSuccess(true);
      
      // Navigate immediately - the animation will overlay during navigation
      navigate("/mentor", { replace: true });
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      
      {isAuthSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50 animate-fade-in">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 mb-4 relative animate-pulse">
              <img
                src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
                alt="Amity University"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-2xl font-bold font-display animate-fade-in mb-3">
              Welcome to AmiPass
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Setting up your account...</span>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-6">
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
          
          <Tabs defaultValue="student" value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <form onSubmit={handleStudentRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Full Name</Label>
                    <Input
                      id="student-name"
                      placeholder="John Doe"
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
                      placeholder="john.doe@example.com"
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
                      placeholder="e.g., CS20220001"
                      value={studentEnrollment}
                      onChange={(e) => setStudentEnrollment(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-contact">Contact Number</Label>
                    <Input
                      id="student-contact"
                      placeholder="+1234567890"
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="student-guardian-contact">Guardian Contact Number</Label>
                  <Input
                    id="student-guardian-contact"
                    placeholder="+1234567890"
                    value={studentGuardianContact}
                    onChange={(e) => setStudentGuardianContact(e.target.value)}
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
                    <Select 
                      value={studentSemester} 
                      onValueChange={setStudentSemester}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="student-semester">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            Semester {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="student-section">Section</Label>
                    <Select 
                      value={studentSection} 
                      onValueChange={setStudentSection}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="student-section">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Section A</SelectItem>
                        <SelectItem value="B">Section B</SelectItem>
                        <SelectItem value="C">Section C</SelectItem>
                      </SelectContent>
                    </Select>
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
                
                <div className="space-y-2">
                  <Label htmlFor="mentor-email">Email Address</Label>
                  <Input
                    id="mentor-email"
                    type="email"
                    placeholder="jane.smith@amity.edu"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    disabled={isLoading}
                  />
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
                  <div className="grid grid-cols-3 gap-4 pt-1">
                    {["A", "B", "C"].map(section => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`section-${section}`}
                          checked={mentorSections.includes(section)}
                          onCheckedChange={() => handleSectionToggle(section)}
                        />
                        <label 
                          htmlFor={`section-${section}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Section {section}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* New fields for branches, courses, and semesters */}
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
                
                <div className="space-y-2">
                  <Label>Semesters You Handle</Label>
                  <div className="grid grid-cols-4 gap-4 pt-1">
                    {Array.from({ length: 8 }, (_, i) => String(i + 1)).map(semester => (
                      <div key={semester} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`semester-${semester}`}
                          checked={mentorSemesters.includes(semester)}
                          onCheckedChange={() => handleSemesterToggle(semester)}
                        />
                        <label 
                          htmlFor={`semester-${semester}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Sem {semester}
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
    </div>
  );
}
