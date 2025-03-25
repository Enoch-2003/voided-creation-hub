
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Outpass, OutpassStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Check, X, Clock, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface OutpassCardProps {
  outpass: Outpass;
  userRole: "student" | "mentor";
  onApprove?: (id: string) => void;
  onDeny?: (id: string, reason?: string) => void;
  showActions?: boolean;
  onViewQR?: (outpass: Outpass) => void;
}

export function OutpassCard({ 
  outpass, 
  userRole, 
  onApprove, 
  onDeny, 
  showActions = false,
  onViewQR
}: OutpassCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const statusColors: Record<OutpassStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    denied: "bg-red-100 text-red-800 border-red-200"
  };
  
  const statusIcons: Record<OutpassStatus, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    approved: <Check className="h-4 w-4" />,
    denied: <X className="h-4 w-4" />
  };

  const handleDeny = () => {
    if (onDeny) {
      const reason = window.prompt("Please enter reason for denial:");
      if (reason !== null) {
        onDeny(outpass.id, reason);
      }
    }
  };
  
  const handleViewQR = () => {
    if (outpass.status === "approved") {
      if (onViewQR) {
        onViewQR(outpass);
      } else {
        // Check if this outpass has a verification URL and use that
        const baseUrl = window.location.origin;
        const verificationUrl = `${baseUrl}/outpass/verify/${outpass.id}`;
        
        // Clear any previous session flag for this outpass
        sessionStorage.removeItem(`outpass_viewed_${outpass.id}`);
        
        // Open the verification URL in a new tab
        window.open(verificationUrl, '_blank');
        
        toast({
          title: "QR Code Available",
          description: "Opening verification page in a new tab."
        });
      }
    } else {
      toast({
        title: "No QR Code Available",
        description: "This outpass has not been approved yet.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="overflow-hidden border-l-4 hover:shadow-md transition-shadow" 
      style={{ borderLeftColor: outpass.status === 'pending' 
        ? 'rgb(234 179 8)' 
        : outpass.status === 'approved' 
          ? 'rgb(22 163 74)' 
          : 'rgb(220 38 38)' 
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{outpass.reason}</CardTitle>
            <CardDescription>
              {userRole === "mentor" ? `${outpass.studentName} (${outpass.enrollmentNumber})` : "Exit Pass"}
            </CardDescription>
          </div>
          <Badge className={`${statusColors[outpass.status]} flex items-center gap-1`}>
            {statusIcons[outpass.status]}
            <span className="capitalize">{outpass.status}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Exit Date & Time:</span>
            <span className="font-medium">{formatDateTime(outpass.exitDateTime)}</span>
          </div>
          
          {outpass.mentorName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mentor:</span>
              <span className="font-medium">{outpass.mentorName}</span>
            </div>
          )}
          
          {outpass.scanTimestamp && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scanned at:</span>
              <span className="font-medium">{formatDateTime(outpass.scanTimestamp)}</span>
            </div>
          )}
          
          {outpass.status === 'denied' && outpass.denyReason && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-md text-xs">
              <span className="font-semibold">Denial Reason:</span> {outpass.denyReason}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-wrap gap-2">
        {showActions && userRole === 'mentor' && outpass.status === 'pending' && (
          <>
            <Button size="sm" variant="default" onClick={() => onApprove?.(outpass.id)} className="flex-1">
              <Check className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeny} className="flex-1">
              <X className="mr-1 h-4 w-4" /> Deny
            </Button>
          </>
        )}
        
        {userRole === 'student' && outpass.status === 'approved' && (
          <Button size="sm" variant="outline" onClick={handleViewQR} className="w-full">
            <QrCode className="mr-1 h-4 w-4" /> View QR Code
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
