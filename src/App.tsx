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
import { setupRealtimeFunctions } from "@/integrations/supabase/realtimeUtils";
import { toast } from "sonner";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [user, setUser] = useState<User | Student | Mentor | Admin | null>(null);
  const navigate = useNavigate();

  // Set up realtime functions when the app loads
  useEffect(() => {
    const setupRealtime = async () => {
      try {
        await setupRealtimeFunctions();
        console.log("Realtime functions set up successfully");
      } catch (error) {
        console.error("Failed to set up real-time functions:", error);
        toast.error("Failed to set up real-time updates. Some features may not work properly.");
      }
    };
    
    setupRealtime();
  }, []);
  
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

  const handleLogin = (userId: string, loggedInUserRole: string) => {
    // Retrieve user data from sessionStorage, as Login.tsx has just set it
    const storedUser = sessionStorage.getItem("user")
      ? JSON.parse(sessionStorage.getItem("user") as string)
      : null;

    setIsAuthenticated(true);
    setUserRole(loggedInUserRole);
    setUser(storedUser as User | Student | Mentor | Admin | null); // Set user state here
    
    // Redirect based on user role
    if (loggedInUserRole === "student") {
      navigate('/student');
    } else if (loggedInUserRole === "mentor") {
      navigate('/mentor');
    } else if (loggedInUserRole === "admin") {
      navigate('/admin');
    }
  };

  // Set up real-time listeners for user updates
  useEffect(() => {
    if (!user || !userRole) return;

    // Use explicit table name based on user role
    let tableName: "students" | "mentors" | "admins" = 
      userRole === "student" ? "students" :
      userRole === "mentor" ? "mentors" :
      userRole === "admin" ? "admins" : "students"; // default to students as fallback

    const channel = supabase
      .channel(`user-updates-${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: tableName,
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          console.log(`User profile updated:`, payload.new);
          
          // Update the user in session storage and state
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            // Remove password for security - ensure type safety by checking
            // if password property exists before attempting to delete it
            const updatedUser = { ...data };
            if ('password' in updatedUser) {
              delete (updatedUser as any).password;
            }
            
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
            sessionStorage.setItem('userId', updatedUser.id);
            setUser(updatedUser as Student | Mentor | Admin);
            
            // Show toast notification
            toast.success("Your profile information has been updated");
          }
        })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userRole]);

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
              <Navigate to="/not-found" /> // Should not happen if userRole is set
            )
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />
      <Route path="/register" element={<Register />} />
      <Route
        path="/student"
        element={
          isAuthenticated && userRole === "student" && user ? ( // Added user check
            <StudentDashboard user={user as Student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/student/outpasses"
        element={
          isAuthenticated && userRole === "student" && user ? ( // Added user check
            <StudentOutpasses user={user as Student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/student/request"
        element={
          isAuthenticated && userRole === "student" && user ? ( // Added user check
            <StudentRequest user={user as Student} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor"
        element={
          isAuthenticated && userRole === "mentor" && user ? ( // Added user check
            <MentorDashboard user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor/pending"
        element={
          isAuthenticated && userRole === "mentor" && user ? ( // Added user check
            <MentorPending user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor/approved"
        element={
          isAuthenticated && userRole === "mentor" && user ? ( // Added user check
            <MentorApproved user={user as Mentor} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/mentor/denied"
        element={
          isAuthenticated && userRole === "mentor" && user ? ( // Added user check
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
          isAuthenticated && userRole === "admin" && user ? ( // Added user check
            <AdminDashboard user={user as Admin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        } 
      />
      <Route 
        path="/admin/student/edit" 
        element={
          isAuthenticated && userRole === "admin" && user ? ( // Added user check
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
