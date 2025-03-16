
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { UserRole } from "@/lib/types";
import { Loader2, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import storageSync from "@/lib/storageSync";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const [isLoading, setIsLoading] = useState(false);
  
  // Student form state
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  
  // Mentor form state
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");

  // Forgot password states
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole") as UserRole | null;
    const userJson = sessionStorage.getItem("user");
    
    if (userRole && userJson) {
      try {
        const user = JSON.parse(userJson); // Validate JSON
        
        // Check if user object is valid (has at least an id property)
        if (user && user.id) {
          if (userRole === "student") {
            navigate("/student", { replace: true });
          } else if (userRole === "mentor") {
            navigate("/mentor", { replace: true });
          }
        } else {
          // Invalid user object
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("userRole");
          storageSync.logout();
        }
      } catch (error) {
        // Handle JSON parse error
        console.error("Error parsing user data:", error);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userRole");
        storageSync.logout();
      }
    }
  }, [navigate]);
  
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !studentPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get all users from localStorage
      const usersJson = localStorage.getItem("users");
      if (!usersJson) {
        throw new Error("No users found");
      }
      
      const users = JSON.parse(usersJson);
      
      // Find student by enrollment number and password
      const student = users.find(
        (user: any) => 
          user.role === "student" && 
          user.enrollmentNumber === studentId && 
          user.password === studentPassword
      );
      
      if (!student) {
        throw new Error("Invalid credentials");
      }
      
      // Initialize outpass data if not exists
      if (!localStorage.getItem("outpasses")) {
        localStorage.setItem("outpasses", JSON.stringify([]));
      }
      
      // Create a complete student object without circular references
      const safeStudent = {
        id: student.id || crypto.randomUUID(),
        name: student.name || "Student",
        email: student.email || "",
        role: "student" as UserRole,
        enrollmentNumber: student.enrollmentNumber,
        contactNumber: student.contactNumber || "",
        guardianNumber: student.guardianNumber || "",
        department: student.department || "",
        course: student.course || "",
        branch: student.branch || "",
        semester: student.semester || "",
        section: student.section || "",
      };
      
      // Clear any existing session data first
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userRole");
      
      // Save user data to sessionStorage
      sessionStorage.setItem("user", JSON.stringify(safeStudent));
      sessionStorage.setItem("userRole", "student");
      
      // Save user data using our sync method
      storageSync.setUser(safeStudent, "student");
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You have successfully logged in as a student.",
      });
      
      // Direct navigation without animation or setTimeout
      navigate("/student", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleMentorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mentorEmail || !mentorPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get all users from localStorage
      const usersJson = localStorage.getItem("users");
      if (!usersJson) {
        throw new Error("No users found");
      }
      
      const users = JSON.parse(usersJson);
      
      // Find mentor by email and password
      const mentor = users.find(
        (user: any) => 
          user.role === "mentor" && 
          user.email === mentorEmail && 
          user.password === mentorPassword
      );
      
      if (!mentor) {
        throw new Error("Invalid credentials");
      }
      
      // Initialize outpass data if not exists
      if (!localStorage.getItem("outpasses")) {
        localStorage.setItem("outpasses", JSON.stringify([]));
      }
      
      // Create a complete mentor object without circular references
      const safeMentor = {
        id: mentor.id || crypto.randomUUID(),
        name: mentor.name || "Mentor",
        email: mentor.email || "",
        role: "mentor" as UserRole,
        department: mentor.department || "",
        contactNumber: mentor.contactNumber || "",
        branches: mentor.branches || [],
        courses: mentor.courses || [],
        sections: mentor.sections || [],
        semesters: mentor.semesters || []
      };
      
      // Clear any existing session data first
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("userRole");
      
      // Save user data to sessionStorage
      sessionStorage.setItem("user", JSON.stringify(safeMentor));
      sessionStorage.setItem("userRole", "mentor");
      
      // Save user data using our sync method
      storageSync.setUser(safeMentor, "mentor");
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You have successfully logged in as a mentor.",
      });
      
      // Direct navigation without animation or setTimeout
      navigate("/mentor", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      setResetLoading(false);
      return;
    }

    try {
      // Get all users from localStorage
      const usersJson = localStorage.getItem("users");
      if (!usersJson) {
        throw new Error("No users found");
      }
      
      const users = JSON.parse(usersJson);
      
      // Find user by email
      const user = users.find((user: any) => user.email === resetEmail);
      
      if (!user) {
        throw new Error("No account found with this email address");
      }

      // In a real application, we would send a reset email here
      // For this demo, we'll reset the password to a default value
      
      // Update the user's password in localStorage
      const updatedUsers = users.map((u: any) => {
        if (u.email === resetEmail) {
          return {
            ...u,
            password: "password123" // Default reset password
          };
        }
        return u;
      });
      
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Close dialog and show success message
      setIsResetOpen(false);
      setResetEmail("");
      
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset to 'password123'",
        variant: "default",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
    
    setResetLoading(false);
  };

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
              <h1 className="text-2xl font-bold font-display">Login to AmiPass</h1>
              <p className="text-muted-foreground">
                Access your campus outpass system
              </p>
            </div>
            <div className="w-8"></div> {/* Empty div for balance */}
          </div>
          
          <Tabs defaultValue="student" value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="student">
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-id">Enrollment Number</Label>
                  <Input
                    id="student-id"
                    type="text"
                    placeholder="e.g., CS20220001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="student-password">Password</Label>
                    <Dialog open={isResetOpen && activeTab === "student"} onOpenChange={setIsResetOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="h-auto p-0 text-xs">
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset your password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a password reset link.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="name@example.com"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              disabled={resetLoading}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={resetLoading}>
                              {resetLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Resetting...
                                </>
                              ) : (
                                "Reset Password"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="student-password"
                    type="password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login as Student"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="mentor">
              <form onSubmit={handleMentorLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mentor-email">Email Address</Label>
                  <Input
                    id="mentor-email"
                    type="email"
                    placeholder="name@amity.edu"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mentor-password">Password</Label>
                    <Dialog open={isResetOpen && activeTab === "mentor"} onOpenChange={setIsResetOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="h-auto p-0 text-xs">
                          Forgot password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset your password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we'll send you a password reset link.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="name@amity.edu"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              disabled={resetLoading}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={resetLoading}>
                              {resetLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Resetting...
                                </>
                              ) : (
                                "Reset Password"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="mentor-password"
                    type="password"
                    value={mentorPassword}
                    onChange={(e) => setMentorPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login as Mentor"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
