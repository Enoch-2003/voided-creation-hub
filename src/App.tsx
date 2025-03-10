
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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedUserRole = localStorage.getItem("userRole") as UserRole | null;
    
    if (storedUser && storedUserRole) {
      setUser(JSON.parse(storedUser));
      setUserRole(storedUserRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    setUser(null);
    setUserRole(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Student Routes - Protected */}
            <Route 
              path="/student" 
              element={
                userRole === "student" ? 
                <StudentDashboard user={user as Student} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route 
              path="/student/outpasses" 
              element={
                userRole === "student" ? 
                <StudentOutpasses user={user as Student} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route 
              path="/student/request" 
              element={
                userRole === "student" ? 
                <StudentRequest user={user as Student} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            
            {/* Mentor Routes - Protected */}
            <Route 
              path="/mentor" 
              element={
                userRole === "mentor" ? 
                <MentorDashboard user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route 
              path="/mentor/pending" 
              element={
                userRole === "mentor" ? 
                <MentorPending user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route 
              path="/mentor/approved" 
              element={
                userRole === "mentor" ? 
                <MentorApproved user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route 
              path="/mentor/denied" 
              element={
                userRole === "mentor" ? 
                <MentorDenied user={user as Mentor} onLogout={handleLogout} /> : 
                <Navigate to="/login" />
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
