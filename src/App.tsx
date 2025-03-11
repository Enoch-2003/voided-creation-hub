
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import StudentOutpasses from "./pages/StudentOutpasses";
import StudentRequest from "./pages/StudentRequest";
import MentorPending from "./pages/MentorPending";
import MentorApproved from "./pages/MentorApproved";
import MentorDenied from "./pages/MentorDenied";
import NotFound from "./pages/NotFound";
import { Student, Mentor, UserRole } from "./lib/types";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<Student | Mentor | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem("user");
    const storedUserRole = localStorage.getItem("userRole") as UserRole | null;
    
    if (storedUser && storedUserRole) {
      try {
        setUser(JSON.parse(storedUser));
        setUserRole(storedUserRole);
      } catch (error) {
        // Handle JSON parse error by clearing invalid data
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    setUserRole(null);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Public Routes - redirect if already logged in */}
            <Route 
              path="/login" 
              element={userRole ? (
                userRole === "student" ? <Navigate to="/student" replace /> : <Navigate to="/mentor" replace />
              ) : <Login />}
            />
            <Route 
              path="/register" 
              element={userRole ? (
                userRole === "student" ? <Navigate to="/student" replace /> : <Navigate to="/mentor" replace />
              ) : <Register />}
            />
            
            {/* Student Routes - Protected */}
            <Route 
              path="/student" 
              element={
                userRole === "student" && user ? 
                <StudentDashboard user={user as Student} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/student/outpasses" 
              element={
                userRole === "student" && user ? 
                <StudentOutpasses user={user as Student} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/student/request" 
              element={
                userRole === "student" && user ? 
                <StudentRequest user={user as Student} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            
            {/* Mentor Routes - Protected */}
            <Route 
              path="/mentor" 
              element={
                userRole === "mentor" && user ? 
                <MentorDashboard user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/mentor/pending" 
              element={
                userRole === "mentor" && user ? 
                <MentorPending user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/mentor/approved" 
              element={
                userRole === "mentor" && user ? 
                <MentorApproved user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/mentor/denied" 
              element={
                userRole === "mentor" && user ? 
                <MentorDenied user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
