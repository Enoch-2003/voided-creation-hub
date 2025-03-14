
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";

interface NavbarProps {
  userRole?: UserRole;
  userName?: string;
  onLogout?: () => void;
}

export function Navbar({ userRole, userName, onLogout }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
                alt="Amity University"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight">
              AmiPass
            </span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-1">
            {!userRole ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            ) : userRole === "student" ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/student/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/student/outpasses">My Outpasses</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/student/request">New Request</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/mentor/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/mentor/pending">Pending</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/mentor/approved">Approved</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/mentor/denied">Denied</Link>
                </Button>
              </>
            )}

            {userRole && (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l">
                <div className="text-sm font-medium">
                  <span className="text-muted-foreground">Hello, </span>
                  <span>{userName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md shadow-lg border-t mt-4 animate-fade-in">
          <nav className="container mx-auto px-4 py-6 flex flex-col space-y-4">
            {!userRole ? (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            ) : userRole === "student" ? (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/student/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/student/outpasses">My Outpasses</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/student/request">New Request</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/mentor/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/mentor/pending">Pending</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/mentor/approved">Approved</Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/mentor/denied">Denied</Link>
                </Button>
              </>
            )}

            {userRole && (
              <div className="pt-4 mt-4 border-t flex items-center justify-between">
                <div className="text-sm font-medium">
                  <span className="text-muted-foreground">Logged in as </span>
                  <span>{userName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onLogout} 
                  className="text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
