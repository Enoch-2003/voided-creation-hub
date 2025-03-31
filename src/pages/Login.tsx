
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRole } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

interface LoginProps {
  onLogin: (userId: string, userRole: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<UserRole | "admin">("student");
  const [isLoading, setIsLoading] = useState(false);
  
  // Student login state
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  
  // Mentor login state
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPassword, setMentorPassword] = useState("");
  
  // Admin login state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const navigate = useNavigate();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Select the appropriate credentials based on active tab
      let email = "";
      let password = "";
      let tableName: "students" | "mentors" | "admins";
      let usernameField = "email";
      
      if (activeTab === "student") {
        email = studentEmail;
        password = studentPassword;
        tableName = "students";
      } else if (activeTab === "mentor") {
        email = mentorEmail;
        password = mentorPassword;
        tableName = "mentors";
      } else if (activeTab === "admin") {
        email = adminUsername;
        password = adminPassword;
        tableName = "admins";
        usernameField = "username";
      } else {
        throw new Error("Invalid user role");
      }
      
      // Check if inputs are valid
      if (!email || !password) {
        toast.error("Please fill all required fields");
        setIsLoading(false);
        return;
      }
      
      // Query the database for user credentials
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(usernameField, email)
        .single();
      
      if (error || !data) {
        toast.error(`Login failed: User not found`);
        setIsLoading(false);
        return;
      }
      
      // Check if password matches
      if (data.password !== password) {
        toast.error("Incorrect password");
        setIsLoading(false);
        return;
      }
      
      // Login successful
      toast.success(`Welcome back, ${data.name}`);
      
      // Store user data in session storage
      sessionStorage.setItem('user', JSON.stringify(data));
      sessionStorage.setItem('userId', data.id);
      sessionStorage.setItem('userRole', activeTab);
      
      // Call the login callback
      onLogin(data.id, activeTab);
      
      // Navigate to appropriate dashboard based on role
      if (activeTab === "student") {
        navigate("/student/dashboard");
      } else if (activeTab === "mentor") {
        navigate("/mentor/dashboard");
      } else if (activeTab === "admin") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-24 h-24 mb-4">
            <img
              src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
              alt="Amity University"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold font-display">
            Amity University, Madhya Pradesh
          </h1>
          <p className="text-gray-500 mt-1">Outpass Management System</p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole | "admin")}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="mentor">Mentor</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="studentEmail" className="block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="studentEmail"
                    type="email"
                    placeholder="student@example.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="studentPassword" className="block text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="studentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                
                <p className="text-sm text-center text-gray-500 mt-4">
                  Don't have an account?{" "}
                  <a href="/register" className="text-blue-600 hover:underline">
                    Register
                  </a>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="mentor">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="mentorEmail" className="block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="mentorEmail"
                    type="email"
                    placeholder="mentor@example.com"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="mentorPassword" className="block text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="mentorPassword"
                    type="password"
                    placeholder="••••••••"
                    value={mentorPassword}
                    onChange={(e) => setMentorPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                
                <p className="text-sm text-center text-gray-500 mt-4">
                  Don't have an account?{" "}
                  <a href="/register" className="text-blue-600 hover:underline">
                    Register
                  </a>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="adminUsername" className="block text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="adminUsername"
                    type="text"
                    placeholder="admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="adminPassword" className="block text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
