
import { Button } from "@/components/ui/button";
import { Outpass } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Download, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";
import { jsPDF } from "jspdf";

interface QRCodeProps {
  outpass: Outpass;
  onClose: () => void;
}

export function QRCode({ outpass, onClose }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && outpass.qrCode) {
      // Generate QR code
      QRCodeLib.toCanvas(canvasRef.current, outpass.qrCode, {
        width: 240,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      
      // Add logo to the center of the QR code
      if (logoRef.current && logoRef.current.complete) {
        addLogoToQRCode();
      } else if (logoRef.current) {
        logoRef.current.onload = addLogoToQRCode;
      }
    }
  }, [outpass.qrCode]);
  
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
      
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4 relative">
        <canvas ref={canvasRef} className="w-60 h-60"></canvas>
        <img 
          ref={logoRef}
          src="/lovable-uploads/945f9f70-9eb7-406e-bf17-148621ddf5cb.png"
          alt="Amity Logo"
          className="hidden" // Hidden but used to load the image
        />
      </div>
      
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
