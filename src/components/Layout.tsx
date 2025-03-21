
import React, { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Admin, Mentor, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  HomeIcon, 
  ClipboardListIcon, 
  PlusCircleIcon, 
  LogOutIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCog
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  user: Student | Mentor | Admin;
  onLogout: () => void;
  activeTab?: string;
}

export function Layout({ children, user, onLogout, activeTab }: LayoutProps) {
  const location = useLocation();
  const { pathname } = location;
  
  // Define navigation based on user role
  const getNavigation = () => {
    if (user.role === "student") {
      return [
        { name: "Dashboard", href: "/student", icon: HomeIcon },
        { name: "My Outpasses", href: "/student/outpasses", icon: ClipboardListIcon },
        { name: "Request Outpass", href: "/student/request", icon: PlusCircleIcon },
      ];
    } else if (user.role === "mentor") {
      return [
        { name: "Dashboard", href: "/mentor", icon: HomeIcon },
        { name: "Pending", href: "/mentor/pending", icon: ClockIcon },
        { name: "Approved", href: "/mentor/approved", icon: CheckCircleIcon },
        { name: "Denied", href: "/mentor/denied", icon: XCircleIcon },
      ];
    } else if (user.role === "admin") {
      return [
        { name: "Dashboard", href: "/admin", icon: HomeIcon },
        { name: "Edit Student Profile", href: "/admin/student/edit", icon: UserCog },
      ];
    }
    
    return [];
  };
  
  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img
                  className="h-8 w-auto"
                  src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
                  alt="Amity University"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">AmiPass</div>
                  <div className="text-xs text-gray-500">{user.name}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between">
            <div className="flex -mb-px">
              {navigation.map((item) => {
                const isActive = activeTab ? item.name.toLowerCase() === activeTab.toLowerCase() : pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } inline-flex items-center px-4 pt-4 pb-3 border-b-2 text-sm font-medium`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-16">
        {children}
      </main>
    </div>
  );
}
