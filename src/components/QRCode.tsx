
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Outpass } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeProps {
  outpass: Outpass;
  onClose?: () => void;
}

export function QRCode({ outpass, onClose }: QRCodeProps) {
  const { toast } = useToast();
  const isExpired = new Date(outpass.exitDateTime) < new Date();
  
  const handleDownload = () => {
    // In a real app, this would create a downloadable QR code
    // For now, just show a success message
    toast({
      title: "QR code downloaded",
      description: "The QR code has been saved to your device.",
    });
  };
  
  const handleScan = () => {
    // In a real app, this would trigger a scan by the security personnel
    // For demo, we'll just update the outpass with a scan timestamp
    const outpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
    const updatedOutpasses = outpasses.map((pass: Outpass) => {
      if (pass.id === outpass.id) {
        return {
          ...pass,
          scanTimestamp: new Date().toISOString(),
        };
      }
      return pass;
    });
    
    localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
    
    toast({
      title: "QR code scanned",
      description: "Your exit has been verified by security. Safe travels!",
    });
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Exit Pass QR Code</CardTitle>
        <CardDescription>
          Show this QR code to security personnel at the gate
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center space-y-4">
        {isExpired && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md flex items-center gap-2 w-full">
            <AlertTriangle className="h-5 w-5" />
            <span>This QR code has expired.</span>
          </div>
        )}
        
        <div className="border p-4 rounded-md bg-white">
          {/* Display the QR code image */}
          <img 
            src={outpass.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=OUTPASS_ID_${outpass.id}`} 
            alt="QR Code" 
            className="w-56 h-56"
          />
        </div>
        
        <div className="w-full text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student:</span>
            <span className="font-medium">{outpass.studentName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Enrollment No:</span>
            <span className="font-medium">{outpass.enrollmentNumber}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exit Time:</span>
            <span className="font-medium">{formatDateTime(outpass.exitDateTime)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Approved By:</span>
            <span className="font-medium">{outpass.mentorName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Purpose:</span>
            <span className="font-medium">{outpass.reason}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {!isExpired && (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-1 h-4 w-4" /> Download
            </Button>
            
            {/* For demo purposes, we'll include a "Scan" button that security would use */}
            <Button onClick={handleScan}>
              Simulate Security Scan
            </Button>
          </div>
        )}
        
        <Button variant="ghost" onClick={onClose} className="w-full">
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}
