import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Outpass, SerialCodeLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import { jsPDF } from "jspdf";

export default function OutpassVerify() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [outpass, setOutpass] = useState<Outpass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [serialCode, setSerialCode] = useState<string>("");
  const [linkExpired, setLinkExpired] = useState(false);
  
  useEffect(() => {
    const fetchOutpass = () => {
      setLoading(true);
      
      try {
        console.log("Verifying outpass ID:", id);
        
        // Get all outpasses from localStorage
        const storedOutpasses = localStorage.getItem("outpasses");
        if (!storedOutpasses) {
          setError("No outpass data found");
          setLoading(false);
          return;
        }
        
        const outpasses: Outpass[] = JSON.parse(storedOutpasses);
        console.log("Found outpasses:", outpasses.length);
        
        const foundOutpass = outpasses.find(op => op.id === id);
        
        if (!foundOutpass) {
          console.error("Outpass not found with ID:", id);
          setError("Outpass not found");
          setLoading(false);
          return;
        }
        
        console.log("Found outpass:", foundOutpass);
        
        if (foundOutpass.status !== "approved") {
          setError("This outpass has not been approved");
          setLoading(false);
          return;
        }
        
        // Set expired flag if already scanned
        if (foundOutpass.scanTimestamp) {
          setLinkExpired(true);
        }
        
        // Get latest serial code prefix from logs
        const serialCodeLogs = localStorage.getItem("serialCodeLogs");
        let prefix = "XYZ";
        
        if (serialCodeLogs) {
          const logs: SerialCodeLog[] = JSON.parse(serialCodeLogs);
          if (logs.length > 0) {
            // Get the most recent log
            const latestLog = logs.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            prefix = latestLog.prefix;
          }
        }
        
        // Set the serial code using the latest prefix or use the existing one if already set
        if (foundOutpass.serialCode) {
          setSerialCode(foundOutpass.serialCode);
        } else {
          const newSerialCode = `AUMP-${prefix}-${foundOutpass.id.substring(0, 6).toUpperCase()}`;
          setSerialCode(newSerialCode);
          
          // Update outpass serialCode if not already set
          foundOutpass.serialCode = newSerialCode;
        }
        
        // If not already scanned, mark as scanned
        if (!foundOutpass.scanTimestamp) {
          console.log("Marking outpass as scanned");
          // Mark as scanned and update localStorage
          foundOutpass.scanTimestamp = new Date().toISOString();
          localStorage.setItem("outpasses", JSON.stringify(
            outpasses.map(op => op.id === id ? foundOutpass : op)
          ));
          
          toast.success("Outpass verified successfully!");
        } else {
          console.log("Outpass already scanned at:", foundOutpass.scanTimestamp);
          toast.warning("This outpass has already been used");
        }
        
        setOutpass(foundOutpass);
        setLoading(false);
        setVerified(true);
      } catch (error) {
        console.error("Error verifying outpass:", error);
        setError("An error occurred while verifying the outpass");
        setLoading(false);
      }
    };
    
    if (id) {
      fetchOutpass();
    } else {
      setError("Invalid QR code");
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    if (linkExpired && !loading) {
      // Add a brief timeout to allow the toast to show
      const timer = setTimeout(() => {
        setError("This outpass link has already been used and is no longer valid");
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [linkExpired, loading]);
  
  const handleReturn = () => {
    window.close();
  };
  
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
    
    // Add Amity University logo as image if available
    pdf.addImage("/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png", "PNG", 95, 30, 20, 20);
    
    // Add verification serial number
    pdf.setFontSize(14);
    pdf.text(`Verification Code: ${serialCode}`, 105, 60, { align: "center" });
    
    // Add verification timestamp
    pdf.setFontSize(10);
    pdf.text(`Verified on: ${new Date().toLocaleString()}`, 105, 70, { align: "center" });
    
    // Add a line separator
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 80, 190, 80);
    
    // Student information
    pdf.setFontSize(12);
    pdf.text("Student Information", 20, 90);
    
    pdf.setFontSize(10);
    pdf.text(`Name: ${outpass.studentName}`, 20, 100);
    pdf.text(`Enrollment Number: ${outpass.enrollmentNumber}`, 20, 110);
    pdf.text(`Section: ${outpass.studentSection || "N/A"}`, 20, 120);
    
    // Outpass details
    pdf.setFontSize(12);
    pdf.text("Outpass Details", 20, 140);
    
    pdf.setFontSize(10);
    pdf.text(`Exit Date & Time: ${formatDateTime(outpass.exitDateTime)}`, 20, 150);
    pdf.text(`Reason: ${outpass.reason}`, 20, 160);
    pdf.text(`Approved By: ${outpass.mentorName || "Not specified"}`, 20, 170);
    pdf.text(`Approved On: ${formatDateTime(outpass.updatedAt)}`, 20, 180);
    
    // Add verification status
    pdf.setFontSize(12);
    pdf.setTextColor(0, 150, 0);
    pdf.text("✓ This student is authorized to exit the campus", 105, 200, { align: "center" });
    pdf.setTextColor(0, 0, 0);
    
    // Add a note about one-time use
    pdf.setFontSize(8);
    pdf.text("This exit permit is valid only for the date and time mentioned above.", 105, 230, { align: "center" });
    pdf.text("This slip has been automatically marked as used and cannot be presented again.", 105, 235, { align: "center" });
    pdf.text("Please show this to the security personnel when exiting the campus.", 105, 240, { align: "center" });
    
    // Save the PDF
    pdf.save(`AmiPass-Exit-Permit-${outpass.id}.pdf`);
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
            <div className="flex justify-center gap-3">
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={handleReturn} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
