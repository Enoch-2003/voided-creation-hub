
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { QRCode } from "@/components/QRCode";
import { Student, Outpass } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CalendarCheck, CalendarX, Clock } from "lucide-react";

interface StudentOutpassesProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentOutpasses({ user, onLogout }: StudentOutpassesProps) {
  const [outpasses, setOutpasses] = useState<Outpass[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOutpass, setSelectedOutpass] = useState<Outpass | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  
  useEffect(() => {
    // Load outpasses from localStorage
    const storedOutpasses = localStorage.getItem("outpasses");
    if (storedOutpasses) {
      const allOutpasses = JSON.parse(storedOutpasses);
      // Filter outpasses for the current student
      const studentOutpasses = allOutpasses.filter(
        (outpass: Outpass) => outpass.studentId === user.id
      );
      setOutpasses(studentOutpasses);
    }
  }, [user.id]);
  
  const filteredOutpasses = outpasses.filter(outpass => {
    if (activeTab === "all") return true;
    return outpass.status === activeTab;
  });
  
  const handleViewQR = (outpass: Outpass) => {
    setSelectedOutpass(outpass);
    setShowQRDialog(true);
  };
  
  const EmptyState = ({ status }: { status: string }) => {
    const icons = {
      all: Clock,
      pending: Clock,
      approved: CalendarCheck,
      denied: CalendarX,
    };
    
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Icon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No {status} outpasses found</h3>
        <p className="text-muted-foreground">
          {status === "pending" && "You don't have any pending outpass requests."}
          {status === "approved" && "You don't have any approved outpasses yet."}
          {status === "denied" && "You don't have any denied outpass requests."}
          {status === "all" && "You haven't made any outpass requests yet."}
        </p>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">My Outpasses</h1>
          <p className="text-muted-foreground">
            View and manage all your outpass requests
          </p>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Outpasses</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="denied">Denied</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOutpasses.length > 0 ? (
                filteredOutpasses
                  .sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )
                  .map(outpass => (
                    <div key={outpass.id} className="relative">
                      <OutpassCard 
                        outpass={outpass} 
                        userRole="student" 
                      />
                      {outpass.status === "approved" && (
                        <button
                          onClick={() => handleViewQR(outpass)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                        >
                          <span className="sr-only">View QR Code</span>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <rect x="7" y="7" width="3" height="3"></rect>
                            <rect x="14" y="7" width="3" height="3"></rect>
                            <rect x="7" y="14" width="3" height="3"></rect>
                            <rect x="14" y="14" width="3" height="3"></rect>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
              ) : (
                <div className="col-span-full">
                  <EmptyState status={activeTab} />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          {selectedOutpass && (
            <QRCode 
              outpass={selectedOutpass} 
              onClose={() => setShowQRDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
