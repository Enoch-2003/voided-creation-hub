
import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { Outpass } from "@/lib/types";
import { ClipboardCopy, CheckCircle, XCircle, Clock, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

export default function OutpassVerify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serialCode, setSerialCode] = useState<string>("");
  
  useEffect(() => {
    if (!id) {
      setError("Invalid outpass ID");
      setIsLoading(false);
      return;
    }
    
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (!storedOutpasses) {
      setError("No outpasses found in the system");
      setIsLoading(false);
      return;
    }
    
    try {
      // Parse outpasses and find the one with matching ID
      const allOutpasses = JSON.parse(storedOutpasses);
      const foundOutpass = allOutpasses.find((o: Outpass) => o.id === id);
      
      if (!foundOutpass) {
        setError("Outpass not found");
        setIsLoading(false);
        return;
      }
      
      // Check if the outpass is approved
      if (foundOutpass.status !== "approved") {
        setError("This outpass has not been approved");
        setIsLoading(false);
        return;
      }
      
      // Get the serial code prefix from settings
      let prefix = "XYZ"; // Default prefix
      
      // Try to get the most recent prefix from logs
      const serialCodeLogs = localStorage.getItem("serialCodeLogs");
      if (serialCodeLogs) {
        try {
          const logs = JSON.parse(serialCodeLogs);
          if (logs && logs.length > 0) {
            // Sort logs by creation date (descending) and take the first one
            const sortedLogs = logs.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            if (sortedLogs.length > 0 && sortedLogs[0].prefix) {
              prefix = sortedLogs[0].prefix;
            }
          }
        } catch (error) {
          console.error("Error parsing serial code logs:", error);
        }
      }
      
      // Set the serial code using the latest prefix with numeric digits or use the existing one if already set
      if (foundOutpass.serialCode) {
        setSerialCode(foundOutpass.serialCode);
      } else {
        // Generate a 6-digit random number instead of using alphanumeric ID
        const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
        const newSerialCode = `AUMP-${prefix}-${randomDigits}`;
        setSerialCode(newSerialCode);
        
        // Update outpass serialCode if not already set
        const updatedOutpasses = allOutpasses.map((o: Outpass) => {
          if (o.id === id) {
            return {
              ...o,
              serialCode: newSerialCode
            };
          }
          return o;
        });
        
        // Save back to localStorage
        localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
      }
      
      // Set isVerified based on whether it has been scanned before
      setIsVerified(!!foundOutpass.scanTimestamp);
      
      // If the outpass hasn't been scanned yet, mark it as scanned
      if (!foundOutpass.scanTimestamp) {
        // Save the scan timestamp
        const scanTimestamp = new Date().toISOString();
        
        // Update in local storage
        const updatedOutpasses = allOutpasses.map((o: Outpass) => {
          if (o.id === id) {
            return {
              ...o,
              scanTimestamp
            };
          }
          return o;
        });
        
        // Save back to localStorage
        localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
        
        // Update foundOutpass with the scan timestamp
        foundOutpass.scanTimestamp = scanTimestamp;
      }
      
      // Set the outpass data
      setOutpass(foundOutpass);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setError("Error loading outpass data");
      setIsLoading(false);
    }
  }, [id]);
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(serialCode);
    toast.success("Serial code copied to clipboard");
  };
  
  // Handler for downloading the outpass as PDF
  const handleDownloadPDF = () => {
    if (!outpass) return;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    // Add title
    pdf.setFontSize(18);
    pdf.text("AmiPass - Campus Exit Permit", 105, 20, { align: "center" });
    
    // Add verification info
    pdf.setFontSize(14);
    pdf.text(`Verification Status: ${isVerified ? 'Verified' : 'Newly Verified'}`, 105, 30, { align: "center" });
    pdf.text(`Verification Time: ${formatDateTime(outpass.scanTimestamp || new Date().toISOString())}`, 105, 38, { align: "center" });
    
    // Add line separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 45, 190, 45);
    
    // Add outpass details
    pdf.setFontSize(12);
    pdf.text("Exit Permit Details", 20, 55);
    
    pdf.setFontSize(10);
    pdf.text(`Student Name: ${outpass.studentName}`, 20, 65);
    pdf.text(`Enrollment Number: ${outpass.enrollmentNumber}`, 20, 73);
    pdf.text(`Section: ${outpass.studentSection || 'N/A'}`, 20, 81);
    pdf.text(`Exit Date & Time: ${formatDateTime(outpass.exitDateTime)}`, 20, 89);
    pdf.text(`Reason: ${outpass.reason}`, 20, 97);
    pdf.text(`Serial Code: ${serialCode}`, 20, 105);
    
    // Add approval details
    pdf.setFontSize(12);
    pdf.text("Approval Information", 20, 120);
    
    pdf.setFontSize(10);
    pdf.text(`Status: Approved`, 20, 130);
    pdf.text(`Approved By: ${outpass.mentorName || "Not specified"}`, 20, 138);
    pdf.text(`Approved On: ${formatDateTime(outpass.updatedAt)}`, 20, 146);
    
    // Add verification note
    pdf.setFontSize(8);
    pdf.setTextColor(255, 0, 0);
    pdf.text("THIS OUTPASS IS VALID FOR ONE-TIME USE ONLY", 105, 170, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    
    // Add footer
    pdf.setFontSize(8);
    pdf.text("This outpass has been verified by the AmiPass system.", 105, 220, { align: "center" });
    pdf.text("Please show this to the security personnel when exiting the campus.", 105, 225, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 230, { align: "center" });
    
    // Save the PDF
    pdf.save(`AmiPass-Verification-${outpass.id}.pdf`);
    
    toast.success("Verification PDF downloaded successfully");
  };
  
  const handleNavigateToStudent = () => {
    navigate("/student");
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-16 w-16 mx-auto text-blue-500 animate-pulse mb-4" />
          <h2 className="text-xl font-medium text-gray-900">Verifying outpass...</h2>
          <p className="mt-2 text-gray-500">Please wait while we check your outpass</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto text-center p-6">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-medium text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  if (!outpass) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 mb-4 relative">
            <img
              src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
              alt="Amity University"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold">AmiPass Verification</h1>
          {isVerified ? (
            <Badge className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">
              Previously Verified
            </Badge>
          ) : (
            <Badge className="mt-2 px-3 py-1 bg-green-100 text-green-800 border-green-200">
              Verified Now
            </Badge>
          )}
        </div>
        
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Exit Permit</CardTitle>
                <CardDescription>
                  This outpass has been verified and is valid
                </CardDescription>
              </div>
              <CheckCircle className="h-7 w-7 text-green-500" />
            </div>
          </CardHeader>
          
          <CardContent className="pb-2 space-y-6">
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Serial Code</div>
              <div className="flex justify-between items-center">
                <div className="font-mono font-bold">{serialCode}</div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCopyToClipboard}
                  className="h-8 w-8"
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Student Details</div>
              <div className="font-bold">{outpass.studentName}</div>
              <div className="text-sm">{outpass.enrollmentNumber}</div>
              {outpass.studentSection && (
                <div className="text-sm">Section: {outpass.studentSection}</div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Exit Details</div>
              <div>
                <span className="font-medium">Date & Time: </span>
                <span>{formatDateTime(outpass.exitDateTime)}</span>
              </div>
              <div>
                <span className="font-medium">Reason: </span>
                <span>{outpass.reason}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Approval Details</div>
              <div>
                <span className="font-medium">Approved by: </span>
                <span>{outpass.mentorName}</span>
              </div>
              <div>
                <span className="font-medium">Approved on: </span>
                <span>{formatDateTime(outpass.updatedAt)}</span>
              </div>
            </div>
            
            <div className="space-y-1 pb-3">
              <div className="font-medium text-sm text-muted-foreground">Verification Details</div>
              <div>
                <span className="font-medium">Verified on: </span>
                <span>{formatDateTime(outpass.scanTimestamp || new Date().toISOString())}</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-3 border-t flex flex-col sm:flex-row gap-2">
            <div className="flex items-center text-sm text-muted-foreground mb-2 sm:mb-0 sm:mr-auto">
              <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
              Valid for this exit only
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="default" 
                onClick={handleDownloadPDF}
                size="sm"
                className="sm:mr-2 flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleNavigateToStudent}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
