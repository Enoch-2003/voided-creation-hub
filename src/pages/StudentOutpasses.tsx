
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Student, Outpass } from "@/lib/types";
import { FileText, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface StudentOutpassesProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentOutpasses({ user, onLogout }: StudentOutpassesProps) {
  const navigate = useNavigate();
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const allOutpasses = JSON.parse(storedOutpasses);
      // Filter only outpasses for this student
      const studentOutpasses = allOutpasses.filter(
        (outpass: Outpass) => outpass.studentId === user.id
      );
      setOutpasses(studentOutpasses);
    }
  }, [user.id]);
  
  // Apply status filter
  const filteredByStatus = filter === "all"
    ? outpasses
    : outpasses.filter(outpass => outpass.status === filter);
  
  // Apply search filter
  const filteredOutpasses = searchQuery
    ? filteredByStatus.filter(outpass => 
        outpass.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        new Date(outpass.exitDateTime).toLocaleDateString().includes(searchQuery)
      )
    : filteredByStatus;
  
  const handleOutpassClick = (outpass: Outpass) => {
    navigate(`/student/outpass/${outpass.id}`);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">My Outpasses</h1>
          <p className="text-muted-foreground">
            View and manage your outpass requests
          </p>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reason or date..."
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
          
          <div>
            <RadioGroup
              defaultValue="all"
              value={filter}
              onValueChange={setFilter}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="pending" />
                <Label htmlFor="pending">Pending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved">Approved</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="denied" id="denied" />
                <Label htmlFor="denied">Denied</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <div className="flex justify-end mb-6">
          <Button onClick={() => navigate("/student/request")}>
            Request New Outpass
          </Button>
        </div>
        
        {filteredOutpasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOutpasses
              .sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .map(outpass => (
                <div 
                  key={outpass.id} 
                  onClick={() => handleOutpassClick(outpass)}
                  className="cursor-pointer transition-transform hover:scale-[1.01]"
                >
                  <OutpassCard outpass={outpass} userRole="student" />
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No outpasses found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || filter !== "all"
                ? "No outpasses match your current filters."
                : "You haven't submitted any outpass requests yet."}
            </p>
            {(searchQuery || filter !== "all") && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => {
                  setSearchQuery("");
                  setFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
