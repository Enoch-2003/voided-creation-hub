
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
import OutpassVerify from "./pages/OutpassVerify";
import { Student, Mentor, UserRole } from "./lib/types";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => {
  const [user, setUser] = useState<Student | Mentor | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user data from sessionStorage
    const loadUserData = () => {
      try {
        // Get user data from sessionStorage (tab-specific)
        const storedUser = sessionStorage.getItem("user");
        const storedUserRole = sessionStorage.getItem("userRole") as UserRole | null;
        
        if (storedUser && storedUserRole) {
          try {
            const parsedUser = JSON.parse(storedUser);
            
            // Ensure user object has required fields
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              setUserRole(storedUserRole);
            } else {
              // Invalid user object
              sessionStorage.removeItem("user");
              sessionStorage.removeItem("userRole");
              setUser(null);
              setUserRole(null);
            }
          } catch (error) {
            // Handle JSON parse error by clearing invalid data
            console.error("Error parsing user data:", error);
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("userRole");
            setUser(null);
            setUserRole(null);
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
        
        // Always set loading to false, regardless of result
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading user data:", error);
        setIsLoading(false);
        setUser(null);
        setUserRole(null);
      }
    };

    // Initial load
    loadUserData();
  }, []);

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userRole");
    setUser(null);
    setUserRole(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 mb-4 relative animate-pulse">
            <img
              src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
              alt="Amity University"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
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
              element={userRole && user ? (
                userRole === "student" ? <Navigate to="/student" replace /> : <Navigate to="/mentor" replace />
              ) : <Login />}
            />
            <Route 
              path="/register" 
              element={userRole && user ? (
                userRole === "student" ? <Navigate to="/student" replace /> : <Navigate to="/mentor" replace />
              ) : <Register />}
            />
            
            {/* QR Code Verification Page - Public Route */}
            <Route path="/verify/:id" element={<OutpassVerify />} />
            
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
