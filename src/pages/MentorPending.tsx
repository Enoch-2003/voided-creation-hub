
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Mentor, Outpass, OutpassStatus } from "@/lib/types";
import { generateQRCode } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Clock, X, Search, User, FileText, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOutpasses } from "@/hooks/useOutpasses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface MentorPendingProps {
  user: Mentor;
  onLogout: () => void;
}

export default function MentorPending({ user, onLogout }: MentorPendingProps) {
  const { toast } = useToast();
  const { outpasses, updateOutpass } = useOutpasses();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "enrollment" | "all">("all");
  
  // Denial dialog state
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [outpassToDeny, setOutpassToDeny] = useState<string | null>(null);
  
  // Filter outpasses by mentor's sections
  const sectionFilteredOutpasses = outpasses.filter((outpass) => {
    return outpass.studentSection && user.sections.includes(outpass.studentSection);
  });
  
  // Filter by status: pending
  const pendingOutpasses = sectionFilteredOutpasses.filter(o => o.status === "pending");
  
  // Apply search filter if query exists
  const filteredOutpasses = searchQuery 
    ? pendingOutpasses.filter(o => {
        const query = searchQuery.toLowerCase();
        if (searchType === "name") {
          return o.studentName.toLowerCase().includes(query);
        } else if (searchType === "enrollment") {
          return o.enrollmentNumber.toLowerCase().includes(query);
        } else {
          return (
            o.studentName.toLowerCase().includes(query) ||
            o.enrollmentNumber.toLowerCase().includes(query) ||
            o.reason.toLowerCase().includes(query)
          );
        }
      })
    : pendingOutpasses;
  
  const handleApprove = (id: string) => {
    // Find the outpass to approve
    const outpassToUpdate = outpasses.find(o => o.id === id);
    if (!outpassToUpdate) return;
    
    // Update the outpass with explicit OutpassStatus type
    const updatedOutpass: Outpass = {
      ...outpassToUpdate,
      status: "approved" as OutpassStatus,
      mentorId: user.id,
      mentorName: user.name,
      qrCode: generateQRCode(outpassToUpdate.id),
      updatedAt: new Date().toISOString()
    };
    
    // Update outpass using the hook
    updateOutpass(updatedOutpass);
    
    // Show success toast
    toast({
      title: "Outpass approved",
      description: "Student has been notified and QR code generated.",
    });
  };
  
  const handleOpenDenyDialog = (id: string) => {
    setOutpassToDeny(id);
    setDenyReason("");
    setDenyDialogOpen(true);
  };
  
  const handleConfirmDeny = () => {
    if (!outpassToDeny) return;
    
    // Find the outpass to deny
    const outpassToUpdate = outpasses.find(o => o.id === outpassToDeny);
    if (!outpassToUpdate) return;
    
    // Update the outpass with explicit OutpassStatus type
    const updatedOutpass: Outpass = {
      ...outpassToUpdate,
      status: "denied" as OutpassStatus,
      mentorId: user.id,
      mentorName: user.name,
      denyReason: denyReason.trim() || "No reason provided",
      updatedAt: new Date().toISOString()
    };
    
    // Update outpass using the hook
    updateOutpass(updatedOutpass);
    
    // Close dialog and reset state
    setDenyDialogOpen(false);
    setOutpassToDeny(null);
    setDenyReason("");
    
    // Show success toast
    toast({
      title: "Outpass denied",
      description: "Student has been notified of the denial.",
    });
  };
  
  const handleCancelDeny = () => {
    setDenyDialogOpen(false);
    setOutpassToDeny(null);
    setDenyReason("");
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="mentor" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">Pending Requests</h1>
          <p className="text-muted-foreground">
            Review and manage pending outpass requests from students in your sections: {user.sections.map(s => `Section ${s}`).join(", ")}
          </p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending requests..."
              className="pl-9 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Tabs 
            defaultValue="all" 
            value={searchType} 
            onValueChange={(value) => setSearchType(value as "name" | "enrollment" | "all")}
            className="w-full max-w-xs"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="name">Student Name</TabsTrigger>
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Showing {filteredOutpasses.length} of {pendingOutpasses.length} pending requests
            </span>
          </div>
        </div>
        
        {filteredOutpasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOutpasses
              .sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
              .map(outpass => (
                <OutpassCard 
                  key={outpass.id} 
                  outpass={outpass} 
                  userRole="mentor"
                  onApprove={handleApprove}
                  onDeny={handleOpenDenyDialog}
                  showActions={true}
                />
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No pending requests</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery 
                ? "No pending requests match your search criteria. Try a different search."
                : "You don't have any pending outpass requests to review at the moment."}
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </main>
      
      {/* Denial Reason Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Deny Outpass Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this outpass request. The student will see this reason.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Enter denial reason..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="resize-none min-h-32"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDeny}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeny}>
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
