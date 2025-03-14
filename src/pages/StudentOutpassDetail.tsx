
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Outpass, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, MapPin, FileText, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { QRCode } from "@/components/QRCode";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StudentOutpassDetailProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentOutpassDetail({ user, onLogout }: StudentOutpassDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [isQrScanned, setIsQrScanned] = useState(false);

  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses && id) {
      const allOutpasses = JSON.parse(storedOutpasses);
      const foundOutpass = allOutpasses.find((o: Outpass) => o.id === id);
      if (foundOutpass) {
        setOutpass(foundOutpass);
        
        // Check if this QR has been scanned before
        const scannedQRs = JSON.parse(localStorage.getItem("scannedQRs") || "[]");
        setIsQrScanned(scannedQRs.includes(id));
      }
    }
  }, [id]);

  if (!outpass) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
        <main className="flex-1 container mx-auto px-4 pt-20 pb-10 flex items-center justify-center">
          <Card className="w-full max-w-lg text-center p-6">
            <CardTitle className="text-xl mb-4">Outpass Not Found</CardTitle>
            <p className="mb-6">The requested outpass could not be found.</p>
            <Button onClick={() => navigate("/student/outpasses")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Outpasses
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (error) {
      console.error("Invalid date format:", error);
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "p");
    } catch (error) {
      console.error("Invalid date format:", error);
      return dateString;
    }
  };

  const getStatusColor = () => {
    switch (outpass.status) {
      case "approved":
        return "bg-green-500 text-white";
      case "denied":
        return "bg-red-500 text-white";
      default:
        return "bg-yellow-500 text-white";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={() => navigate("/student/outpasses")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Outpasses
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Outpass Details</CardTitle>
                  <Badge className={getStatusColor()}>
                    {outpass.status.charAt(0).toUpperCase() + outpass.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <User className="mr-2 h-4 w-4" /> Student Name
                    </p>
                    <p className="font-medium">{outpass.studentName}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Enrollment Number</p>
                    <p className="font-medium">{outpass.enrollmentNumber}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="mr-2 h-4 w-4" /> Exit Date
                    </p>
                    <p className="font-medium">{formatDate(outpass.exitDateTime)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Clock className="mr-2 h-4 w-4" /> Exit Time
                    </p>
                    <p className="font-medium">{formatTime(outpass.exitDateTime)}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground flex items-center mb-2">
                    <FileText className="mr-2 h-4 w-4" /> Reason for Exit
                  </p>
                  <p className="bg-muted p-3 rounded-md">{outpass.reason}</p>
                </div>
                
                {outpass.mentorName && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Approved By</p>
                    <p className="font-medium">{outpass.mentorName}</p>
                  </div>
                )}
                
                {outpass.status === "denied" && outpass.denyReason && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground flex items-center mb-2">
                      <AlertTriangle className="mr-2 h-4 w-4 text-destructive" /> Denial Reason
                    </p>
                    <p className="bg-destructive/10 p-3 rounded-md text-destructive">{outpass.denyReason}</p>
                  </div>
                )}
                
                <div className="pt-2 border-t space-y-1">
                  <p className="text-sm text-muted-foreground">Created on</p>
                  <p className="font-medium">{formatDate(outpass.createdAt)} at {formatTime(outpass.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {outpass.status === "approved" && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">QR Code</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {isQrScanned ? (
                    <div className="relative flex flex-col items-center">
                      <div className="relative">
                        <QRCode outpass={outpass} size={200} />
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-md">
                          <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                          <p className="font-bold text-lg text-destructive">Expired QR</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <QRCode outpass={outpass} size={200} />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Important Notice</AlertTitle>
                    <AlertDescription>
                      This QR code is for single-time use only. Once scanned, it will be invalidated and cannot be used again.
                    </AlertDescription>
                  </Alert>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
