
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import StudentOutpasses from "./pages/StudentOutpasses";
import StudentRequest from "./pages/StudentRequest";
import StudentOutpassDetail from "./pages/StudentOutpassDetail";
import MentorDashboard from "./pages/MentorDashboard";
import MentorPending from "./pages/MentorPending";
import MentorApproved from "./pages/MentorApproved";
import MentorDenied from "./pages/MentorDenied";
import NotFound from "./pages/NotFound";
import QRScanResult from "./pages/QRScanResult";
import { Toaster } from "sonner";
import { Student, Mentor } from "./lib/types";
import storageSync from "./lib/storageSync";

function App() {
  const [user, setUser] = useState<Student | Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in via sessionStorage
    const storedUser = sessionStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        sessionStorage.removeItem("currentUser");
      }
    }
    
    setLoading(false);
  }, []);
  
  const handleLogout = () => {
    sessionStorage.removeItem("currentUser");
    setUser(null);
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === "student" ? "/student/dashboard" : "/mentor/dashboard"} />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === "student" ? "/student/dashboard" : "/mentor/dashboard"} />} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={user && user.role === "student" ? <StudentDashboard user={user as Student} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/student/outpasses" element={user && user.role === "student" ? <StudentOutpasses user={user as Student} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/student/request" element={user && user.role === "student" ? <StudentRequest user={user as Student} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/student/outpass/:id" element={user && user.role === "student" ? <StudentOutpassDetail user={user as Student} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        
        {/* Mentor Routes */}
        <Route path="/mentor/dashboard" element={user && user.role === "mentor" ? <MentorDashboard user={user as Mentor} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/mentor/pending" element={user && user.role === "mentor" ? <MentorPending user={user as Mentor} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/mentor/approved" element={user && user.role === "mentor" ? <MentorApproved user={user as Mentor} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/mentor/denied" element={user && user.role === "mentor" ? <MentorDenied user={user as Mentor} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        
        {/* QR Code Scan Result */}
        <Route path="/scan/:id" element={<QRScanResult />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
