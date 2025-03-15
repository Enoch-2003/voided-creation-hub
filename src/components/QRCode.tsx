
import { Button } from "@/components/ui/button";
import { Outpass } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Download, XCircle, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";
import { jsPDF } from "jspdf";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface QRCodeProps {
  outpass: Outpass;
  onClose: () => void;
}

export function QRCode({ outpass, onClose }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string>("");
  
  // Check if the QR code is already scanned/expired
  useEffect(() => {
    if (outpass.scanTimestamp) {
      setIsExpired(true);
    }
  }, [outpass.scanTimestamp]);
  
  // Generate the verification URL
  useEffect(() => {
    // Create the verification URL using the window location origin for absolute URL
    // This ensures it works when scanned from any device
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/verify/${outpass.id}`;
    setVerificationUrl(url);
    
    // Log the URL for debugging
    console.log("Generated verification URL:", url);
  }, [outpass.id]);
  
  // Generate QR code once we have the verification URL
  useEffect(() => {
    if (!verificationUrl || !canvasRef.current) return;
    
    // Generate QR code with the verification URL
    QRCodeLib.toCanvas(canvasRef.current, verificationUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    }).then(() => {
      // Add logo to the center of the QR code
      if (logoRef.current && logoRef.current.complete) {
        addLogoToQRCode();
      } else if (logoRef.current) {
        logoRef.current.onload = addLogoToQRCode;
      }
      
      // Apply blur and expired overlay if needed
      if (outpass.scanTimestamp) {
        addExpiredOverlay();
      }
      
      // Update the outpass QR code in localStorage if not already set
      if (!outpass.qrCode) {
        updateOutpassQRCode(verificationUrl);
      }
    }).catch(error => {
      console.error("Error generating QR code:", error);
    });
  }, [verificationUrl, outpass.scanTimestamp, outpass.qrCode, outpass.id]);
  
  const addLogoToQRCode = () => {
    if (!canvasRef.current || !logoRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Calculate logo size and position
    const logoSize = canvas.width * 0.2; // Logo is 20% of QR code size
    const logoX = (canvas.width - logoSize) / 2;
    const logoY = (canvas.height - logoSize) / 2;
    
    // Clear a square in the center
    context.fillStyle = "white";
    context.fillRect(logoX, logoY, logoSize, logoSize);
    
    // Draw the logo
    context.drawImage(logoRef.current, logoX, logoY, logoSize, logoSize);
  };
  
  const addExpiredOverlay = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Add semi-transparent overlay
    context.fillStyle = "rgba(255, 255, 255, 0.7)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add "EXPIRED" text
    context.font = "bold 28px Arial";
    context.fillStyle = "rgba(255, 0, 0, 0.7)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(-Math.PI / 4); // Rotate -45 degrees
    context.fillText("EXPIRED QR", 0, 0);
    context.rotate(Math.PI / 4); // Rotate back
    context.translate(-canvas.width / 2, -canvas.height / 2);
  };
  
  const updateOutpassQRCode = (url: string) => {
    // Update the outpass in localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const outpasses = JSON.parse(storedOutpasses);
      const updatedOutpasses = outpasses.map((op: Outpass) => {
        if (op.id === outpass.id) {
          return { ...op, qrCode: url };
        }
        return op;
      });
      localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
    }
  };
  
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    // Add title
    pdf.setFontSize(18);
    pdf.text("AmiPass - Campus Exit Permit", 105, 20, { align: "center" });
    
    // Add QR code image
    const qrCodeDataUrl = canvas.toDataURL("image/png");
    pdf.addImage(qrCodeDataUrl, "PNG", 75, 30, 60, 60);
    
    // Add Amity University logo
    pdf.addImage("/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png", "PNG", 95, 95, 20, 20);
    
    // Add verification URL
    pdf.setFontSize(8);
    pdf.text("Scan this QR code or visit:", 105, 100, { align: "center" });
    pdf.text(verificationUrl, 105, 105, { align: "center" });
    
    // Add outpass details
    pdf.setFontSize(12);
    pdf.text("Outpass Details", 20, 130);
    
    pdf.setFontSize(10);
    pdf.text(`Student Name: ${outpass.studentName}`, 20, 140);
    pdf.text(`Enrollment Number: ${outpass.enrollmentNumber}`, 20, 150);
    pdf.text(`Exit Date & Time: ${formatDate(outpass.exitDateTime)}`, 20, 160);
    pdf.text(`Reason: ${outpass.reason}`, 20, 170);
    pdf.text(`Status: Approved`, 20, 180);
    pdf.text(`Approved By: ${outpass.mentorName || "Not specified"}`, 20, 190);
    pdf.text(`QR Code ID: ${outpass.id}`, 20, 200);
    
    // Add warning for expired QR codes
    if (outpass.scanTimestamp) {
      pdf.setTextColor(255, 0, 0);
      pdf.text("THIS QR CODE HAS ALREADY BEEN USED AND IS NO LONGER VALID", 105, 210, { align: "center" });
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.setTextColor(255, 0, 0);
      pdf.text("THIS QR CODE CAN ONLY BE USED ONCE", 105, 210, { align: "center" });
      pdf.setTextColor(0, 0, 0);
    }
    
    // Add footer
    pdf.setFontSize(8);
    pdf.text("This outpass is valid only for the date and time mentioned above.", 105, 240, { align: "center" });
    pdf.text("Please show this to the security personnel when exiting the campus.", 105, 245, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 250, { align: "center" });
    
    // Save the PDF
    pdf.save(`AmiPass-${outpass.id}.pdf`);
  };
  
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-4">Your Outpass QR Code</h2>
      
      {isExpired && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>One-time use only</AlertTitle>
          <AlertDescription>
            This QR code has already been scanned and is no longer valid.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4 relative">
        <canvas ref={canvasRef} className="w-60 h-60"></canvas>
        <img 
          ref={logoRef}
          src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
          alt="Amity Logo"
          className="hidden" // Hidden but used to load the image
        />
      </div>
      
      {/* Verification link for manual access */}
      {verificationUrl && !isExpired && (
        <div className="text-xs text-center text-gray-500 mb-4">
          <p>Can't scan? Open this link:</p>
          <a 
            href={verificationUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {verificationUrl}
          </a>
        </div>
      )}
      
      {!isExpired && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important: Single-Use QR Code</AlertTitle>
          <AlertDescription>
            This QR code can only be scanned once. After scanning, it will become invalid and cannot be used again.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Outpass details summary */}
      <div className="space-y-2 w-full mb-4">
        <div className="flex justify-between px-2 py-1 bg-muted rounded text-sm">
          <span className="font-medium">Student:</span>
          <span>{outpass.studentName}</span>
        </div>
        
        <div className="flex justify-between px-2 py-1 bg-muted rounded text-sm">
          <span className="font-medium">Enrollment #:</span>
          <span>{outpass.enrollmentNumber}</span>
        </div>
        
        <div className="flex justify-between px-2 py-1 bg-muted rounded text-sm">
          <span className="font-medium">Exit Time:</span>
          <span>{formatDate(outpass.exitDateTime)}</span>
        </div>
        
        <div className="flex justify-between px-2 py-1 bg-muted rounded text-sm">
          <span className="font-medium">Status:</span>
          <span className="text-green-600 font-medium">Approved</span>
        </div>
      </div>
      
      <div className="flex gap-2 w-full">
        <Button onClick={handleDownload} className="flex-1 gap-2">
          <Download className="h-4 w-4" />
          Save as PDF
        </Button>
        
        <Button onClick={onClose} variant="outline" className="flex-1 gap-2">
          <XCircle className="h-4 w-4" />
          Close
        </Button>
      </div>
    </div>
  );
}
