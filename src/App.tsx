
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentOutpasses from "@/pages/StudentOutpasses";
import StudentRequest from "@/pages/StudentRequest";
import MentorDashboard from "@/pages/MentorDashboard";
import MentorPending from "@/pages/MentorPending";
import MentorApproved from "@/pages/MentorApproved";
import MentorDenied from "@/pages/MentorDenied";
import OutpassVerify from "@/pages/OutpassVerify";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminStudentEdit from "@/pages/AdminStudentEdit";
import NotFound from "@/pages/NotFound";
import { Admin, Mentor, Student, User } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<User | Student | Mentor | Admin | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user") 
      ? JSON.parse(sessionStorage.getItem("user") as string) 
      : null;
    const storedUserRole = sessionStorage.getItem("userRole");

    if (storedUser && storedUserRole) {
      setIsAuthenticated(true);
      setUserRole(storedUserRole);
      setUser(storedUser);
      
      // Redirect based on user role
      if (storedUserRole === "student") {
        if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
          navigate('/student');
        }
      } else if (storedUserRole === "mentor") {
        if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
          navigate('/mentor');
        }
      } else if (storedUserRole === "admin") {
        if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
          navigate('/admin');
        }
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setUser(null);
      // Only redirect to login if not already on login, register, index, or outpass verification pages
      const nonAuthRoutes = ['/login', '/register', '/', '/outpass/verify'];
      if (!nonAuthRoutes.some(route => window.location.pathname.startsWith(route))) {
        navigate('/login');
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.clear();
    
    setIsAuthenticated(false);
    setUserRole(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            userRole === "student" ? (
              <Navigate to="/student" />
            ) : userRole === "mentor" ? (
              <Navigate to="/mentor" />
            ) : userRole === "admin" ? (
              <Navigate to="/admin" />
            ) : (
              <Navigate to="/not-found" />
            )
          ) : (
            <Login />
          )
        }
      />
      <Route path="/register" element={<Register />} />
      <Route
        path="/student"
        element={
          isAuthenticated && userRole === "student" ? (
            <StudentDashboard user={user as Student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/student/outpasses"
        element={
          isAuthenticated && userRole === "student" ? (
            <StudentOutpasses user={user as Student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/student/request"
        element={
          isAuthenticated && userRole === "student" ? (
            <StudentRequest user={user as Student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor"
        element={
          isAuthenticated && userRole === "mentor" ? (
            <MentorDashboard user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor/pending"
        element={
          isAuthenticated && userRole === "mentor" ? (
            <MentorPending user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor/approved"
        element={
          isAuthenticated && userRole === "mentor" ? (
            <MentorApproved user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor/denied"
        element={
          isAuthenticated && userRole === "mentor" ? (
            <MentorDenied user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      
      <Route path="/outpass/verify/:id" element={<OutpassVerify />} />
      
      <Route 
        path="/admin" 
        element={
          isAuthenticated && userRole === "admin" ? (
            <AdminDashboard user={user as Admin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/admin/student/edit" 
        element={
          isAuthenticated && userRole === "admin" ? (
            <AdminStudentEdit user={user as Admin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
