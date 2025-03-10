
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Mentor, Outpass } from "@/lib/types";
import { generateQRCode } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PanelRight, Clock, CheckCheck, XCircle } from "lucide-react";

interface MentorDashboardProps {
  user: Mentor;
  onLogout: () => void;
}

export default function MentorDashboard({ user, onLogout }: MentorDashboardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  
  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const allOutpasses = JSON.parse(storedOutpasses);
      setOutpasses(allOutpasses);
    }
  }, []);
  
  // Filter outpasses by mentor's department, courses, branches, semesters, sections
  const filteredOutpasses = outpasses.filter((outpass) => {
    // In a real app, we would join with student data to get these details
    // For demo, we'll just use the outpasses
    return true; // Accept all outpasses for this demo
  });
  
  const pendingOutpasses = filteredOutpasses.filter(o => o.status === "pending");
  const approvedOutpasses = filteredOutpasses.filter(o => o.status === "approved");
  const deniedOutpasses = filteredOutpasses.filter(o => o.status === "denied");
  
  const handleApprove = (id: string) => {
    // Get current outpasses
    const currentOutpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
    
    // Find and update the outpass
    const updatedOutpasses = currentOutpasses.map((outpass: Outpass) => {
      if (outpass.id === id) {
        return {
          ...outpass,
          status: "approved",
          mentorId: user.id,
          mentorName: user.name,
          qrCode: generateQRCode(outpass.id),
          updatedAt: new Date().toISOString()
        };
      }
      return outpass;
    });
    
    // Save back to localStorage
    localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
    
    // Update local state
    setOutpasses(updatedOutpasses);
    
    // Show success toast
    toast({
      title: "Outpass approved",
      description: "Student has been notified and QR code generated.",
    });
  };
  
  const handleDeny = (id: string, reason: string) => {
    // Get current outpasses
    const currentOutpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
    
    // Find and update the outpass
    const updatedOutpasses = currentOutpasses.map((outpass: Outpass) => {
      if (outpass.id === id) {
        return {
          ...outpass,
          status: "denied",
          mentorId: user.id,
          mentorName: user.name,
          denyReason: reason,
          updatedAt: new Date().toISOString()
        };
      }
      return outpass;
    });
    
    // Save back to localStorage
    localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
    
    // Update local state
    setOutpasses(updatedOutpasses);
    
    // Show success toast
    toast({
      title: "Outpass denied",
      description: "Student has been notified of the denial.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="mentor" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold font-display">Welcome, {user.name}</h1>
              <p className="text-muted-foreground">
                Review and manage student outpass requests
              </p>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Pending Requests</CardTitle>
                      <CardDescription>
                        {pendingOutpasses.length > 0
                          ? `You have ${pendingOutpasses.length} pending requests to review`
                          : "No pending requests waiting for review"}
                      </CardDescription>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => navigate("/mentor/pending")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {pendingOutpasses.length > 0 ? (
                    <div className="space-y-4">
                      {pendingOutpasses
                        .sort((a, b) => 
                          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        )
                        .slice(0, 3)
                        .map(outpass => (
                          <OutpassCard 
                            key={outpass.id} 
                            outpass={outpass} 
                            userRole="mentor" 
                            onApprove={handleApprove}
                            onDeny={handleDeny}
                            showActions={true}
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No pending outpass requests to review
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest outpass approvals and denials
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {approvedOutpasses.length > 0 || deniedOutpasses.length > 0 ? (
                    <div className="space-y-4">
                      {[...approvedOutpasses, ...deniedOutpasses]
                        .sort((a, b) => 
                          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                        )
                        .slice(0, 3)
                        .map(outpass => (
                          <OutpassCard 
                            key={outpass.id} 
                            outpass={outpass} 
                            userRole="mentor"
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <PanelRight className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Profile</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{user.department}</span>
                  </div>
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Branches:</span>
                    <div className="flex flex-wrap gap-1">
                      {user.branches.map(branch => (
                        <span key={branch} className="bg-muted px-2 py-1 rounded text-xs">
                          {branch}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Courses:</span>
                    <div className="flex flex-wrap gap-1">
                      {user.courses.map(course => (
                        <span key={course} className="bg-muted px-2 py-1 rounded text-xs">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Semesters:</span>
                    <div className="flex flex-wrap gap-1">
                      {user.semesters.map(semester => (
                        <span key={semester} className="bg-muted px-2 py-1 rounded text-xs">
                          {semester}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Outpass Statistics</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center p-3 bg-yellow-50 rounded-md">
                    <Clock className="h-6 w-6 text-yellow-500 mr-3" />
                    <div>
                      <div className="text-sm text-yellow-700">Pending</div>
                      <div className="text-2xl font-bold text-yellow-800">
                        {pendingOutpasses.length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-green-50 rounded-md">
                    <CheckCheck className="h-6 w-6 text-green-500 mr-3" />
                    <div>
                      <div className="text-sm text-green-700">Approved</div>
                      <div className="text-2xl font-bold text-green-800">
                        {approvedOutpasses.length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-red-50 rounded-md">
                    <XCircle className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <div className="text-sm text-red-700">Denied</div>
                      <div className="text-2xl font-bold text-red-800">
                        {deniedOutpasses.length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="text-center mb-2">
                      <div className="text-sm text-blue-700">Total Handled</div>
                      <div className="text-3xl font-bold text-blue-800">
                        {approvedOutpasses.length + deniedOutpasses.length}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      {approvedOutpasses.length > 0 || deniedOutpasses.length > 0 ? (
                        <>
                          <div 
                            className="bg-green-500 h-1.5 rounded-l-full" 
                            style={{ 
                              width: `${approvedOutpasses.length / (approvedOutpasses.length + deniedOutpasses.length) * 100}%`,
                              display: 'inline-block'
                            }}
                          ></div>
                          <div 
                            className="bg-red-500 h-1.5 rounded-r-full" 
                            style={{ 
                              width: `${deniedOutpasses.length / (approvedOutpasses.length + deniedOutpasses.length) * 100}%`,
                              display: 'inline-block'
                            }}
                          ></div>
                        </>
                      ) : (
                        <div className="bg-gray-300 h-1.5 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Approved</span>
                      <span>Denied</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
