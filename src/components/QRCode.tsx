
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Outpass } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock, User } from "lucide-react";

interface QRCodeProps {
  outpass: Outpass;
  className?: string;
}

export function QRCode({ outpass, className }: QRCodeProps) {
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Check if QR code is expired (more than 1 hour after approval)
    const checkExpiry = () => {
      const approvalTime = new Date(outpass.updatedAt).getTime();
      const currentTime = new Date().getTime();
      const diff = currentTime - approvalTime;
      const hourInMs = 60 * 60 * 1000;
      
      // Set expiration status
      setIsExpired(diff > hourInMs);
      
      // Calculate time left
      if (diff < hourInMs) {
        const minutesLeft = Math.floor((hourInMs - diff) / (60 * 1000));
        setTimeLeft(`${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`);
      } else {
        setTimeLeft("Expired");
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [outpass.updatedAt]);

  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-amiblue-500 to-amiblue-700 p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-semibold text-lg">Exit QR Code</h3>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {isExpired ? "Expired" : "Valid"}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-white/80 mt-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {isExpired ? "Expired" : `Valid for ${timeLeft}`}
            </div>
          </div>
          
          <div className="p-6 flex flex-col items-center">
            {isExpired ? (
              <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg mb-4">
                <p className="text-muted-foreground text-center px-4">
                  This QR code has expired and is no longer valid
                </p>
              </div>
            ) : (
              <div className="relative mb-4 animate-scale-up">
                <div className="absolute inset-0 bg-amiblue-100 opacity-20 rounded-lg"></div>
                {outpass.qrCode ? (
                  <img 
                    src={outpass.qrCode} 
                    alt="QR Code" 
                    className="w-48 h-48 object-contain relative z-10"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <p className="text-muted-foreground">QR code not available</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="w-full space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <User className="h-4 w-4 mr-1.5" />
                  <span>Student</span>
                </div>
                <span className="font-medium">{outpass.studentName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-muted-foreground">
                  <CalendarClock className="h-4 w-4 mr-1.5" />
                  <span>Exit Time</span>
                </div>
                <span className="font-medium">{formatDateTime(outpass.exitDateTime)}</span>
              </div>
              
              <div className="border-t pt-3 mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Show this QR code to the security personnel at the gate
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
