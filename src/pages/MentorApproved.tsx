
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Mentor, Outpass } from "@/lib/types";
import { CheckCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MentorApprovedProps {
  user: Mentor;
  onLogout: () => void;
}

export default function MentorApproved({ user, onLogout }: MentorApprovedProps) {
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
  
  // Filter outpasses by status: approved
  const approvedOutpasses = outpasses.filter(o => o.status === "approved");
  
  // Apply search filter if query exists
  const filteredOutpasses = searchQuery 
    ? approvedOutpasses.filter(o => 
        o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.reason.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : approvedOutpasses;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="mentor" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">Approved Outpasses</h1>
          <p className="text-muted-foreground">
            View a history of outpass requests you've approved
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
              Showing {filteredOutpasses.length} of {approvedOutpasses.length} approved outpasses
            </span>
          </div>
        </div>
        
        {filteredOutpasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOutpasses
              .sort((a, b) => 
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              )
              .map(outpass => (
                <OutpassCard 
                  key={outpass.id} 
                  outpass={outpass} 
                  userRole="mentor"
                />
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <CheckCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No approved outpasses</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery 
                ? "No approved outpasses match your search criteria. Try a different search."
                : "You haven't approved any outpass requests yet."}
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
