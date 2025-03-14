
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, MapPin, FileText, User, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Outpass } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export default function QRScanResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [serialNumber, setSerialNumber] = useState<string>("");
  const [alreadyScanned, setAlreadyScanned] = useState(false);
  
  useEffect(() => {
    if (id) {
      // Check if this QR has already been scanned
      const scannedQRs = JSON.parse(localStorage.getItem("scannedQRs") || "[]");
      if (scannedQRs.includes(id)) {
        setAlreadyScanned(true);
        return;
      }
      
      // Load outpass from localStorage
      const storedOutpasses = localStorage.getItem("outpasses");
      if (storedOutpasses) {
        const allOutpasses = JSON.parse(storedOutpasses);
        const foundOutpass = allOutpasses.find((o: Outpass) => o.id === id);
        
        if (foundOutpass && foundOutpass.status === "approved") {
          setOutpass(foundOutpass);
          
          // Generate serial number
          const serial = "AMP-" + uuidv4().substring(0, 8).toUpperCase();
          setSerialNumber(serial);
          
          // Mark this QR as scanned
          localStorage.setItem("scannedQRs", JSON.stringify([...scannedQRs, id]));
          
          // Update the outpass with scan timestamp
          const updatedOutpass = {
            ...foundOutpass,
            scanTimestamp: new Date().toISOString()
          };
          
          const updatedOutpasses = allOutpasses.map((o: Outpass) => 
            o.id === id ? updatedOutpass : o
          );
          
          localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
        }
      }
    }
  }, [id]);

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

  if (alreadyScanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold text-destructive">QR Code Already Used</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">This outpass QR code has already been scanned and is no longer valid.</p>
            <Button variant="default" onClick={() => navigate("/")}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!outpass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-2xl font-bold">Invalid or Expired QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">The scanned QR code is invalid or has expired.</p>
            <Button variant="default" onClick={() => navigate("/")}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png" 
                alt="Amity University Logo" 
                className="h-16" 
              />
            </div>
            <CardTitle className="text-2xl font-bold mb-1">STUDENT EXIT PASS</CardTitle>
            <div className="text-sm text-muted-foreground">Amity University, Noida</div>
            <div className="absolute top-6 right-6">
              <Badge className="bg-green-500 text-white px-3 py-1 text-xs">APPROVED</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-bold text-lg">{serialNumber}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-muted-foreground">Date of Issue</p>
                <p className="font-medium">{formatDate(outpass.createdAt)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{outpass.studentSection || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="mr-2 h-4 w-4" /> Exit Date & Time
                  </p>
                  <p className="font-medium">
                    {formatDate(outpass.exitDateTime)} at {formatTime(outpass.exitDateTime)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{outpass.mentorName || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground flex items-center mb-2">
                <FileText className="mr-2 h-4 w-4" /> Reason for Exit
              </p>
              <p className="bg-muted p-3 rounded-md">{outpass.reason}</p>
            </div>
            
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground mb-2">Validation</p>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="font-medium">QR code validated on {formatDate(new Date().toISOString())} at {formatTime(new Date().toISOString())}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">This pass is valid for single use only</p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-6">
            <Button onClick={() => navigate("/")}>Return to Homepage</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
