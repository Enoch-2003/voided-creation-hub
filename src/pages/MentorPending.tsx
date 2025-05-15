
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Mentor, Outpass, OutpassStatus } from "@/lib/types";
import { generateQRCode } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // Updated import path
import { Clock, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOutpasses } from "@/hooks/useOutpasses";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MentorPendingProps {
  user: Mentor; // Initial user from auth
  onLogout: () => void;
}

export default function MentorPending({ user, onLogout }: MentorPendingProps) {
  const { toast } = useToast();
  // `outpasses` from this hook are already filtered by section for the current mentor
  const { outpasses, updateOutpass, isLoading, currentUser } = useOutpasses();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"name" | "enrollment" | "all">("all");

  const currentMentor = (currentUser?.role === 'mentor' ? currentUser : user) as Mentor;
  
  useEffect(() => {
    if (currentMentor && currentMentor.id) {
      sessionStorage.setItem('userId', currentMentor.id);
      sessionStorage.setItem('userRole', 'mentor');
    }
  }, [currentMentor]);
  
  // `outpasses` from the hook is already filtered by the mentor's sections.
  // Filter only by status: pending
  const pendingOutpasses = outpasses.filter(o => o.status === "pending");
  
  // Apply search filter if query exists
  const displayOutpasses = searchQuery 
    ? pendingOutpasses.filter(o => {
        const query = searchQuery.toLowerCase();
        if (searchType === "name") {
          return o.studentName.toLowerCase().includes(query);
        } else if (searchType === "enrollment") {
          return o.enrollmentNumber.toLowerCase().includes(query);
        } else { // 'all'
          return (
            o.studentName.toLowerCase().includes(query) ||
            o.enrollmentNumber.toLowerCase().includes(query) ||
            o.reason.toLowerCase().includes(query)
          );
        }
      })
    : pendingOutpasses;
  
  const handleApprove = (id: string) => {
    const outpassToUpdate = outpasses.find(o => o.id === id);
    if (!outpassToUpdate || !currentMentor) return;
    
    const updatedOutpass: Outpass = {
      ...outpassToUpdate,
      status: "approved" as OutpassStatus,
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      qrCode: generateQRCode(outpassToUpdate.id),
      updatedAt: new Date().toISOString()
    };
    updateOutpass(updatedOutpass);
     toast({ // Using shadcn/ui toast
      title: "Outpass Approved",
      description: `${outpassToUpdate.studentName}'s request has been approved.`,
    });
  };
  
  const handleDeny = (id: string, reason?: string) => {
    const outpassToUpdate = outpasses.find(o => o.id === id);
    if (!outpassToUpdate || !currentMentor) return;
    
    const updatedOutpass: Outpass = {
      ...outpassToUpdate,
      status: "denied" as OutpassStatus,
      mentorId: currentMentor.id,
      mentorName: currentMentor.name,
      denyReason: reason?.trim() || "No reason provided",
      updatedAt: new Date().toISOString()
    };
    updateOutpass(updatedOutpass);
    toast({ // Using shadcn/ui toast
      title: "Outpass Denied",
      description: `${outpassToUpdate.studentName}'s request has been denied.`,
      variant: "destructive"
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="mentor" userName={currentMentor.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">Pending Requests</h1>
          <p className="text-muted-foreground">
            Review and manage pending outpass requests from students in your sections: {currentMentor.sections?.map(s => `Section ${s}`).join(", ") || "No sections assigned"}
          </p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, enrollment, reason..."
              className="pl-9 pr-10 w-full"
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
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Tabs 
              defaultValue="all" 
              value={searchType} 
              onValueChange={(value) => setSearchType(value as "name" | "enrollment" | "all")}
              className="w-full sm:w-auto md:max-w-xs" 
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="name">Name</TabsTrigger>
                <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center justify-end md:justify-start text-sm text-muted-foreground pt-2 md:pt-0">
              Showing {displayOutpasses.length} of {pendingOutpasses.length}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : displayOutpasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayOutpasses
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
