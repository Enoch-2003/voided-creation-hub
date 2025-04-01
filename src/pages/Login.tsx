import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/lib/types";
import { handleApiError } from "@/lib/errorHandler";

interface LoginProps {
  onLogin: (userId: string, userRole: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "mentor" | "admin">("student");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email.trim()) {
        toast.error("Email is required");
        setIsLoading(false);
        return;
      }
      
      if (!password.trim()) {
        toast.error("Password is required");
        setIsLoading(false);
        return;
      }

      // Determine which table to query based on user type
      let tableName: "students" | "mentors" | "admins";
      
      if (userType === "student") {
        tableName = "students";
      } else if (userType === "mentor") {
        tableName = "mentors";
      } else {
        tableName = "admins";
      }

      // Query the database for the user - add proper headers to fix 406 error
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', email.trim())
        .single();

      if (error) {
        console.error("Login query error:", error);
        
        if (error.code === "PGRST116") {
          toast.error(`No ${userType} found with this email`);
        } else {
          toast.error(`Error fetching user: ${error.message}`);
        }
        
        setIsLoading(false);
        return;
      }

      if (!data) {
        toast.error(`No ${userType} found with this email`);
        setIsLoading(false);
        return;
      }

      // Check if the password matches (in a real app, this would use proper hashing)
      if (data.password !== password) {
        toast.error("Incorrect password");
        setIsLoading(false);
        return;
      }

      // Store user data and role in session storage - make sure to omit sensitive information
      const safeUserData = { ...data };
      delete safeUserData.password;
      
      sessionStorage.setItem('user', JSON.stringify(safeUserData));
      sessionStorage.setItem('userRole', userType);

      // Call the onLogin callback
      onLogin(data.id, userType);

      // Display the appropriate message based on user type and available properties
      let displayName = data.name; // All user types have name
      if (userType === 'admin' && 'username' in data) {
        // Only use username for admin users if it exists
        displayName = data.username || data.name;
      }
      
      toast.success(`Logged in as ${displayName}`);
      setIsLoading(false);
    } catch (error) {
      handleApiError(error, "Login");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to AmiPass
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your digital outpass management system
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="userType">
                  I am a
                </label>
                <Select value={userType} onValueChange={(value: "student" | "mentor" | "admin") => setUserType(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
              
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:text-blue-800">
                  Register here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
