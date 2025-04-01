
import React from 'react';
import { XCircle, Download } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface ExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanTimestamp?: string;
  serialCode?: string;
  onClose: () => void;
  onDownload: () => void;
}

export const ExpiredDialog: React.FC<ExpiredDialogProps> = ({
  open,
  onOpenChange,
  scanTimestamp,
  serialCode,
  onClose,
  onDownload
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Outpass Already Verified</DialogTitle>
          <DialogDescription>
            This outpass has already been verified and cannot be used again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
          <p className="text-center mb-2"><strong>Verification Status:</strong> Expired after scan</p>
          <p className="text-center text-sm text-muted-foreground">
            This outpass was first verified on: {formatDateTime(scanTimestamp || "")}
          </p>
          {serialCode && (
            <p className="text-center mt-2"><strong>Serial Code:</strong> {serialCode}</p>
          )}
        </div>
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Return to Dashboard
          </Button>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
