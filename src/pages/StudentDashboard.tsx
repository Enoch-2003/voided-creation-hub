
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Calendar, Clock, Webhook } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { QRCode } from "@/components/QRCode";
import { Student, Outpass } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface StudentDashboardProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const navigate = useNavigate();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const allOutpasses = JSON.parse(storedOutpasses);
      // Filter outpasses for the current student
      const studentOutpasses = allOutpasses.filter(
        (outpass: Outpass) => outpass.studentId === user.id
      );
      setOutpasses(studentOutpasses);
    }
  }, [user.id]);

  // Get active (pending or approved but not yet used) outpasses
  const activeOutpasses = outpasses.filter(
    (outpass) =>
      outpass.status === "pending" ||
      (outpass.status === "approved" &&
        new Date(outpass.exitDateTime) > new Date() &&
        !outpass.scanTimestamp)
  );

  // Get the latest active outpass
  const latestActiveOutpass = activeOutpasses.length > 0 
    ? activeOutpasses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0] 
    : null;

  const handleViewQR = (outpass: Outpass) => {
    setSelectedOutpass(outpass);
    setShowQRDialog(true);
  };

  const handleNewRequest = () => {
    navigate("/student/request");
  };

  const handleViewAll = () => {
    navigate("/student/outpasses");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold font-display">Welcome, {user.name}</h1>
              <p className="text-muted-foreground">
                Manage your campus exit passes and requests
              </p>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Current Active Outpass</CardTitle>
                      <CardDescription>
                        {latestActiveOutpass
                          ? "Your most recent active exit request"
                          : "You don't have any active exit requests"}
                      </CardDescription>
                    </div>
                    
                    <Button onClick={handleNewRequest} size="sm">
                      <PlusCircle className="h-4 w-4 mr-1" /> New Request
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {latestActiveOutpass ? (
                    <div className="space-y-4">
                      <OutpassCard outpass={latestActiveOutpass} userRole="student" />
                      
                      {latestActiveOutpass.status === "approved" && (
                        <Button 
                          onClick={() => handleViewQR(latestActiveOutpass)} 
                          className="w-full"
                        >
                          View QR Code
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No active outpass requests found
                      </p>
                      <Button onClick={handleNewRequest}>Request New Outpass</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Outpasses</CardTitle>
                      <CardDescription>
                        Your recently approved or denied outpasses
                      </CardDescription>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={handleViewAll}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {outpasses.length > 0 ? (
                      outpasses
                        .filter(outpass => outpass.status !== "pending")
                        .sort((a, b) => 
                          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                        )
                        .slice(0, 3)
                        .map(outpass => (
                          <OutpassCard 
                            key={outpass.id} 
                            outpass={outpass} 
                            userRole="student"
                          />
                        ))
                    ) : (
                      <div className="text-center py-6">
                        <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No outpass history found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enrollment No:</span>
                    <span className="font-medium">{user.enrollmentNumber}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{user.department}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course:</span>
                    <span className="font-medium">{user.course}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium">{user.branch}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Semester:</span>
                    <span className="font-medium">{user.semester}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Section:</span>
                    <span className="font-medium">{user.section}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="font-medium">{user.contactNumber}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guardian:</span>
                    <span className="font-medium">{user.guardianNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Outpass Statistics</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-md p-4 text-center">
                    <div className="text-green-600 text-2xl font-bold">
                      {outpasses.filter(o => o.status === "approved").length}
                    </div>
                    <div className="text-green-700 text-sm">Approved</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-md p-4 text-center">
                    <div className="text-yellow-600 text-2xl font-bold">
                      {outpasses.filter(o => o.status === "pending").length}
                    </div>
                    <div className="text-yellow-700 text-sm">Pending</div>
                  </div>
                  
                  <div className="bg-red-50 rounded-md p-4 text-center">
                    <div className="text-red-600 text-2xl font-bold">
                      {outpasses.filter(o => o.status === "denied").length}
                    </div>
                    <div className="text-red-700 text-sm">Denied</div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-md p-4 text-center">
                    <div className="text-blue-600 text-2xl font-bold">
                      {outpasses.length}
                    </div>
                    <div className="text-blue-700 text-sm">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          {selectedOutpass && (
            <QRCode 
              outpass={selectedOutpass} 
              onClose={() => setShowQRDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
