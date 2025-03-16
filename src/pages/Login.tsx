
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { UserRole } from "@/lib/types";
import { Loader2, ChevronLeft, KeyRound } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const userRole = sessionStorage.getItem("userRole") as UserRole | null;
    const userJson = sessionStorage.getItem("user");
    
    if (userRole && userJson) {
      try {
        const user = JSON.parse(userJson);
        
        if (user && user.id) {
          if (userRole === "student") {
            navigate("/student");
          } else if (userRole === "mentor") {
            navigate("/mentor");
          }
        } else {
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("userRole");
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userRole");
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
      
      // Create a student object without password
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
      
      // First clear session storage
      sessionStorage.clear();
      
      // Save user data to sessionStorage
      sessionStorage.setItem("user", JSON.stringify(safeStudent));
      sessionStorage.setItem("userRole", "student");
      
      // Save to sync storage
      storageSync.setUser(safeStudent, "student");
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You have successfully logged in as a student.",
      });
      
      navigate("/student");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      
      // Create a mentor object without password
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
      
      // First clear session storage
      sessionStorage.clear();
      
      // Save user data to sessionStorage
      sessionStorage.setItem("user", JSON.stringify(safeMentor));
      sessionStorage.setItem("userRole", "mentor");
      
      // Save to sync storage
      storageSync.setUser(safeMentor, "mentor");
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You have successfully logged in as a mentor.",
      });
      
      navigate("/mentor");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findUserByEmail = (email: string) => {
    try {
      const usersJson = localStorage.getItem("users");
      if (!usersJson) return null;
      
      const users = JSON.parse(usersJson);
      return users.find((user: any) => user.email === email) || null;
    } catch (error) {
      console.error("Error finding user:", error);
      return null;
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
      // Find user by email
      const user = findUserByEmail(resetEmail);
      
      if (!user) {
        throw new Error("No account found with this email address");
      }

      // If user found, open the reset password dialog
      setIsResetOpen(false);
      setIsResetPasswordOpen(true);
      
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

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setResetLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setResetLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
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
      
      // Find user by email and update password
      const updatedUsers = users.map((u: any) => {
        if (u.email === resetEmail) {
          return {
            ...u,
            password: newPassword
          };
        }
        return u;
      });
      
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Close dialog and show success message
      setResetSuccess(true);
      
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
      setIsResetPasswordOpen(false);
    }
    
    setResetLoading(false);
  };

  const handleResetComplete = () => {
    setResetSuccess(false);
    setIsResetPasswordOpen(false);
    setNewPassword("");
    setConfirmPassword("");
    setResetEmail("");
    
    toast({
      title: "Password Reset Successful",
      description: "Your password has been updated. You can now log in with your new password.",
    });
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
                            Enter your email address to reset your password
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
                                  Verifying...
                                </>
                              ) : (
                                "Continue"
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
                            Enter your email address to reset your password
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
                                  Verifying...
                                </>
                              ) : (
                                "Continue"
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={(open) => {
        if (!open && !resetSuccess) setIsResetPasswordOpen(false);
      }}>
        <DialogContent>
          {!resetSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Reset Password
                </DialogTitle>
                <DialogDescription>
                  Enter your new password below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordReset} className="space-y-4 pt-2">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={resetLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={resetLoading}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          ) : (
            <AlertDialog open={resetSuccess} onOpenChange={setResetSuccess}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Password Reset Successful</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your password has been successfully updated. You can now log in with your new password.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={handleResetComplete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
