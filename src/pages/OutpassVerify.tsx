
import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Outpass } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function OutpassVerify() {
  const { id } = useParams<{ id: string }>();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [serialCode] = useState(`AMP-${Math.floor(100000 + Math.random() * 900000)}`);
  
  useEffect(() => {
    const fetchOutpass = () => {
      setLoading(true);
      
      // Get all outpasses from localStorage
      const storedOutpasses = localStorage.getItem("outpasses");
      if (!storedOutpasses) {
        setError("No outpass data found");
        setLoading(false);
        return;
      }
      
      const outpasses: Outpass[] = JSON.parse(storedOutpasses);
      const foundOutpass = outpasses.find(op => op.id === id);
      
      if (!foundOutpass) {
        setError("Outpass not found");
        setLoading(false);
        return;
      }
      
      if (foundOutpass.status !== "approved") {
        setError("This outpass has not been approved");
        setLoading(false);
        return;
      }
      
      if (foundOutpass.scanTimestamp) {
        setError("This outpass has already been used");
        setVerified(true);
        setLoading(false);
        return;
      }
      
      // Mark as scanned and update localStorage
      foundOutpass.scanTimestamp = new Date().toISOString();
      localStorage.setItem("outpasses", JSON.stringify(outpasses));
      
      setOutpass(foundOutpass);
      setLoading(false);
      setVerified(true);
    };
    
    if (id) {
      fetchOutpass();
    } else {
      setError("Invalid QR code");
      setLoading(false);
    }
  }, [id]);
  
  const handleReturn = () => {
    window.close();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 mb-4">
            <img
              src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
              alt="Amity University"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xl font-semibold text-gray-700">Verifying outpass...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto w-16 h-16 mb-4">
              <img
                src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
                alt="Amity University"
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-xl text-red-600">Verification Failed</CardTitle>
            <CardDescription>
              <div className="flex items-center justify-center gap-2 mt-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span>{error}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleReturn} className="mt-4">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!outpass) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img
                src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
                alt="Amity University"
                className="w-12 h-12 object-contain"
              />
              <div>
                <CardTitle>AmiPass Exit Permit</CardTitle>
                <CardDescription>Campus Exit Verification Slip</CardDescription>
              </div>
            </div>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="text-center mb-2">
              <div className="text-sm text-gray-500">Verification Serial Code</div>
              <div className="text-lg font-mono font-bold">{serialCode}</div>
            </div>
            
            <div className="text-sm text-center text-gray-500">
              Verified on {new Date().toLocaleString()}<br />
              This slip is for one-time use only
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Student Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Name:</div>
                <div className="font-medium">{outpass.studentName}</div>
                
                <div className="text-gray-500">Enrollment #:</div>
                <div className="font-medium">{outpass.enrollmentNumber}</div>
                
                <div className="text-gray-500">Section:</div>
                <div className="font-medium">{outpass.studentSection || "N/A"}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Outpass Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Exit Time:</div>
                <div className="font-medium">{formatDateTime(outpass.exitDateTime)}</div>
                
                <div className="text-gray-500">Reason:</div>
                <div className="font-medium">{outpass.reason}</div>
                
                <div className="text-gray-500">Mentor:</div>
                <div className="font-medium">{outpass.mentorName || "N/A"}</div>
                
                <div className="text-gray-500">Approved On:</div>
                <div className="font-medium">{formatDateTime(outpass.updatedAt)}</div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4 text-center">
            <div className="text-green-600 font-medium mb-2 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-5 w-5" />
              This student is authorized to exit the campus
            </div>
            <div className="text-sm text-gray-500 mb-4">
              This slip has been automatically marked as used and cannot be presented again.
            </div>
            <Button onClick={handleReturn}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
