
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { QRCode } from "@/components/QRCode";
import { Outpass, Student } from "@/lib/types";
import { getMockOutpasses } from "@/lib/utils";
import { Clock, AlertCircle, CheckCircle, XCircle, QrCode, ArrowRight } from "lucide-react";

export default function StudentDashboard() {
  const [user, setUser] = useState<Student | null>(null);
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, we would get the user from context or state management
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");
    
    if (!storedUser || storedRole !== "student") {
      navigate("/login");
      return;
    }
    
    const parsedUser = JSON.parse(storedUser) as Student;
    setUser(parsedUser);
    
    // Fetch outpasses for this student
    const fetchedOutpasses = getMockOutpasses(parsedUser.id, "student");
    setOutpasses(fetchedOutpasses);
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    navigate("/login");
  };
  
  // Get the most recent outpass by status
  const getLatestOutpass = (status: "pending" | "approved" | "denied") => {
    const filtered = outpasses.filter(o => o.status === status);
    if (filtered.length === 0) return null;
    
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };
  
  const pendingOutpass = getLatestOutpass("pending");
  const approvedOutpass = getLatestOutpass("approved");
  const deniedOutpass = getLatestOutpass("denied");
  
  if (!user) {
    return null; // Loading state
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar userRole="student" userName={user.name} onLogout={handleLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Current Status</CardTitle>
                <CardDescription>
                  Your latest outpass status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingOutpass ? (
                  <div className="mb-5 flex items-start space-x-4">
                    <div className="bg-amber-100 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Pending Approval</h3>
                      <p className="text-muted-foreground">
                        Your outpass request is waiting for approval from your mentor
                      </p>
                    </div>
                  </div>
                ) : approvedOutpass ? (
                  <div className="mb-5 flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Outpass Approved</h3>
                      <p className="text-muted-foreground">
                        Your outpass has been approved and is ready to use
                      </p>
                    </div>
                  </div>
                ) : deniedOutpass ? (
                  <div className="mb-5 flex items-start space-x-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Outpass Denied</h3>
                      <p className="text-muted-foreground">
                        Your last outpass request was denied by your mentor
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">No Requests</h3>
                      <p className="text-muted-foreground">
                        You don't have any active outpass requests
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button
                    className="flex-1"
                    variant={pendingOutpass ? "outline" : "default"}
                    onClick={() => navigate("/student/request")}
                  >
                    {pendingOutpass ? "View Pending Request" : "Create New Request"}
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => navigate("/student/outpasses")}
                  >
                    View All Outpasses
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Your Outpasses</CardTitle>
                <CardDescription>
                  Recent outpass requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outpasses.length > 0 ? (
                    outpasses.slice(0, 3).map((outpass) => (
                      <OutpassCard
                        key={outpass.id}
                        outpass={outpass}
                        userRole="student"
                      />
                    ))
                  ) : (
                    <div className="text-center p-6">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="font-medium text-lg">No Outpasses</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't created any outpass requests yet
                      </p>
                      <Button onClick={() => navigate("/student/request")}>
                        Create Your First Outpass
                      </Button>
                    </div>
                  )}
                  
                  {outpasses.length > 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/student/outpasses")}
                    >
                      View All Outpasses <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Your registered information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </div>
                    <div>{user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Enrollment Number
                    </div>
                    <div>{user.enrollmentNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Email
                    </div>
                    <div>{user.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Department / Course
                    </div>
                    <div>
                      {user.department} / {user.course}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Branch / Semester / Section
                    </div>
                    <div>
                      {user.branch} / Semester {user.semester} / Section {user.section}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {approvedOutpass && (
              <div className="mt-6">
                <QRCode outpass={approvedOutpass} />
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/student/outpass/${approvedOutpass.id}`)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  View Full QR Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
