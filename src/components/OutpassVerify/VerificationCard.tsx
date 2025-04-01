
import React from 'react';
import { CheckCircle, ClipboardCopy, AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import { Outpass } from "@/lib/types";

interface VerificationCardProps {
  outpass: Outpass;
  serialCode: string;
  isVerified: boolean;
  onCopyToClipboard: () => void;
  onDownloadPDF: () => void;
  onNavigateToStudent: () => void;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  outpass,
  serialCode,
  isVerified,
  onCopyToClipboard,
  onDownloadPDF,
  onNavigateToStudent
}) => {
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
                  onClick={onCopyToClipboard}
                  className="h-8 w-8"
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Student Details</div>
              <div className="font-bold">{outpass?.studentName}</div>
              <div className="text-sm">{outpass?.enrollmentNumber}</div>
              {outpass?.studentSection && (
                <div className="text-sm">Section: {outpass.studentSection}</div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Exit Details</div>
              <div>
                <span className="font-medium">Date & Time: </span>
                <span>{formatDateTime(outpass?.exitDateTime || "")}</span>
              </div>
              <div>
                <span className="font-medium">Reason: </span>
                <span>{outpass?.reason}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-sm text-muted-foreground">Approval Details</div>
              <div>
                <span className="font-medium">Approved by: </span>
                <span>{outpass?.mentorName}</span>
              </div>
              <div>
                <span className="font-medium">Approved on: </span>
                <span>{formatDateTime(outpass?.updatedAt || "")}</span>
              </div>
            </div>
            
            <div className="space-y-1 pb-3">
              <div className="font-medium text-sm text-muted-foreground">Verification Details</div>
              <div>
                <span className="font-medium">Verified on: </span>
                <span>{formatDateTime(outpass?.scanTimestamp || new Date().toISOString())}</span>
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
                onClick={onDownloadPDF}
                size="sm"
                className="sm:mr-2 flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onNavigateToStudent}
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
};
