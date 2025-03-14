
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OutpassCard } from "@/components/OutpassCard";
import { Button } from "@/components/ui/button";
import { Student, Outpass } from "@/lib/types";
import { FileCheck, FileX, FileClock, PlusCircle } from "lucide-react";

interface StudentDashboardProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const navigate = useNavigate();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  
  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const allOutpasses = JSON.parse(storedOutpasses);
      // Filter only outpasses for this student
      const studentOutpasses = allOutpasses.filter(
        (outpass: Outpass) => outpass.studentId === user.id
      );
      setOutpasses(studentOutpasses);
    }
  }, [user.id]);
  
  // Count outpasses by status
  const approvedCount = outpasses.filter(o => o.status === "approved").length;
  const pendingCount = outpasses.filter(o => o.status === "pending").length;
  const deniedCount = outpasses.filter(o => o.status === "denied").length;
  
  // Get recent outpasses (most recent 3)
  const recentOutpasses = [...outpasses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  const handleOutpassClick = (outpass: Outpass) => {
    navigate(`/student/outpass/${outpass.id}`);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Approved</CardTitle>
              <CardDescription>Outpasses ready to use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-green-500 bg-green-50 border-green-200 text-lg px-3 py-1">
                  {approvedCount}
                </Badge>
                <FileCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending</CardTitle>
              <CardDescription>Awaiting mentor approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-orange-500 bg-orange-50 border-orange-200 text-lg px-3 py-1">
                  {pendingCount}
                </Badge>
                <FileClock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Denied</CardTitle>
              <CardDescription>Requests not approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-red-500 bg-red-50 border-red-200 text-lg px-3 py-1">
                  {deniedCount}
                </Badge>
                <FileX className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recent Outpasses</h2>
          <Button onClick={() => navigate("/student/request")} className="gap-2">
            <PlusCircle className="h-4 w-4" /> New Request
          </Button>
        </div>
        
        {recentOutpasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentOutpasses.map(outpass => (
              <div 
                key={outpass.id} 
                onClick={() => handleOutpassClick(outpass)}
                className="cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <OutpassCard outpass={outpass} userRole="student" />
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">You haven't submitted any outpass requests yet.</p>
              <Button onClick={() => navigate("/student/request")}>
                Request New Outpass
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-8">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/student/outpasses")}
          >
            View All Outpasses
          </Button>
        </div>
      </main>
    </div>
  );
}
