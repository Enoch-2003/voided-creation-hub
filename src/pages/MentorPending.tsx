
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Mentor, Outpass } from "@/lib/types";
import { generateQRCode } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MentorPendingProps {
  user: Mentor;
  onLogout: () => void;
}

export default function MentorPending({ user, onLogout }: MentorPendingProps) {
  const { toast } = useToast();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const allOutpasses = JSON.parse(storedOutpasses);
      setOutpasses(allOutpasses);
    }
  }, []);
  
  // Filter outpasses by status: pending
  const pendingOutpasses = outpasses.filter(o => o.status === "pending");
  
  // Apply search filter if query exists
  const filteredOutpasses = searchQuery 
    ? pendingOutpasses.filter(o => 
        o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.reason.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pendingOutpasses;
  
  const handleApprove = (id: string) => {
    // Get current outpasses
    const currentOutpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
    
    // Find and update the outpass
    const updatedOutpasses = currentOutpasses.map((outpass: Outpass) => {
      if (outpass.id === id) {
        return {
          ...outpass,
          status: "approved",
          mentorId: user.id,
          mentorName: user.name,
          qrCode: generateQRCode(outpass.id),
          updatedAt: new Date().toISOString()
        };
      }
      return outpass;
    });
    
    // Save back to localStorage
    localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
    
    // Update local state
    setOutpasses(updatedOutpasses);
    
    // Show success toast
    toast({
      title: "Outpass approved",
      description: "Student has been notified and QR code generated.",
    });
  };
  
  const handleDeny = (id: string, reason: string) => {
    // Get current outpasses
    const currentOutpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
    
    // Find and update the outpass
    const updatedOutpasses = currentOutpasses.map((outpass: Outpass) => {
      if (outpass.id === id) {
        return {
          ...outpass,
          status: "denied",
          mentorId: user.id,
          mentorName: user.name,
          denyReason: reason,
          updatedAt: new Date().toISOString()
        };
      }
      return outpass;
    });
    
    // Save back to localStorage
    localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
    
    // Update local state
    setOutpasses(updatedOutpasses);
    
    // Show success toast
    toast({
      title: "Outpass denied",
      description: "Student has been notified of the denial.",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="mentor" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">Pending Requests</h1>
          <p className="text-muted-foreground">
            Review and manage pending outpass requests from students
          </p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, enrollment no, or reason..."
              className="pl-3 pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearchQuery("")}
              disabled={!searchQuery}
            >
              {searchQuery && <X className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
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
                  onDeny={handleDeny}
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
    </div>
  );
}
