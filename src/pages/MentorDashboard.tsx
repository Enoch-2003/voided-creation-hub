
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { OutpassCard } from "@/components/OutpassCard";
import { Mentor, Outpass } from "@/lib/types";
import { generateQRCode } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast"; // Updated import path
import { PanelRight, Clock, CheckCheck, XCircle, Edit, Loader2 } from "lucide-react";
import { useOutpasses } from "@/hooks/useOutpasses";
import MentorProfileEdit from "@/components/MentorProfileEdit";

interface MentorDashboardProps {
  user: Mentor; // This is the initially loaded user from auth
  onLogout: () => void;
}

export default function MentorDashboard({ user, onLogout }: MentorDashboardProps) {
  const navigate = useNavigate();
  const { toast } = useToast(); // Using shadcn's toast from the correct path
  // `outpasses` from this hook are already filtered by section for the current mentor
  const { outpasses, updateOutpass, isLoading: outpassesLoading, currentUser, updateUserProfile } = useOutpasses();
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Determine the mentor data to display, prioritizing the dynamically fetched `currentUser`
  // The `user` prop can serve as an initial value or fallback.
  const currentMentor = (currentUser?.role === 'mentor' ? currentUser : user) as Mentor;

  if (outpassesLoading || !currentMentor) { // Simplified loading check
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // `outpasses` from useOutpasses hook is already filtered for the current mentor's sections.
  // No need for additional local `filteredOutpasses`.
  const pendingOutpasses = outpasses.filter(o => o.status === "pending");
  const approvedOutpasses = outpasses.filter(o => o.status === "approved");
  const deniedOutpasses = outpasses.filter(o => o.status === "denied");
  
  const handleProfileUpdate = (updatedMentor: Mentor) => {
    // Call the updateUserProfile function from the useOutpasses (which re-exports from useUserProfile)
    updateUserProfile(updatedMentor); 
    // The UI should reactively update based on `currentUser` changes from the hook.
    setIsEditProfileOpen(false); // Close dialog after update
  };

  const handleApprove = (id: string) => {
    const outpassToUpdate = outpasses.find(o => o.id === id);
    
    if (outpassToUpdate && currentMentor) {
      const updatedOutpass: Outpass = {
        ...outpassToUpdate,
        status: "approved",
        mentorId: currentMentor.id,
        mentorName: currentMentor.name,
        qrCode: generateQRCode(outpassToUpdate.id),
        updatedAt: new Date().toISOString()
      };
      
      updateOutpass(updatedOutpass);
      
      toast({
        title: "Outpass approved",
        description: "Student has been notified and QR code generated.",
      });
    }
  };
  
  const handleDeny = (id: string, reason: string) => {
    const outpassToUpdate = outpasses.find(o => o.id === id);
    
    if (outpassToUpdate && currentMentor) {
      const updatedOutpass: Outpass = {
        ...outpassToUpdate,
        status: "denied",
        mentorId: currentMentor.id,
        mentorName: currentMentor.name,
        denyReason: reason.trim() || "No reason provided",
        updatedAt: new Date().toISOString()
      };
      
      updateOutpass(updatedOutpass);
      
      toast({
        title: "Outpass denied",
        description: "Student has been notified of the denial.",
      });
    }
  };
  
  const handleProfileEdit = () => {
    setIsEditProfileOpen(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="mentor" userName={currentMentor.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold font-display">Welcome, {currentMentor.name}</h1>
              <p className="text-muted-foreground">
                Review and manage student outpass requests for your sections: {currentMentor.sections?.map(s => `Section ${s}`).join(", ") || "No sections assigned"}
              </p>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Pending Requests</CardTitle>
                      <CardDescription>
                        {pendingOutpasses.length > 0
                          ? `You have ${pendingOutpasses.length} pending requests to review`
                          : "No pending requests waiting for review"}
                      </CardDescription>
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={() => navigate("/mentor/pending")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {outpassesLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-4" />
                      <p className="text-muted-foreground">Loading outpass requests...</p>
                    </div>
                  ) : pendingOutpasses.length > 0 ? (
                    <div className="space-y-4">
                      {pendingOutpasses // Already filtered by section via useOutpasses
                        .sort((a, b) => 
                          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                        )
                        .slice(0, 3)
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
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No pending outpass requests to review
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest outpass approvals and denials
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {outpassesLoading ? (
                    <div className="text-center py-6">
                      <Loader2 className="h-8 w-8 mx-auto text-blue-500 animate-spin mb-2" />
                      <p className="text-muted-foreground">Loading activity...</p>
                    </div>
                  ) : approvedOutpasses.length > 0 || deniedOutpasses.length > 0 ? (
                    <div className="space-y-4">
                      {[...approvedOutpasses, ...deniedOutpasses] // Already filtered by section
                        .sort((a, b) => 
                          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                        )
                        .slice(0, 3)
                        .map(outpass => (
                          <OutpassCard 
                            key={outpass.id} 
                            outpass={outpass} 
                            userRole="mentor"
                          />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <PanelRight className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mentor Profile</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleProfileEdit}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{currentMentor.name}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{currentMentor.email}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{currentMentor.department || "Not specified"}</span>
                  </div>
                  
                  {currentMentor.contactNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contact Number:</span>
                      <span className="font-medium">{currentMentor.contactNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Branches:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentMentor.branches && currentMentor.branches.length > 0 ? (
                        currentMentor.branches.map((branch, idx) => (
                          <span key={`${branch}-${idx}`} className="bg-muted px-2 py-1 rounded text-xs">
                            {branch}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No branches assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Courses:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentMentor.courses && currentMentor.courses.length > 0 ? (
                        currentMentor.courses.map((course, idx) => (
                          <span key={`${course}-${idx}`} className="bg-muted px-2 py-1 rounded text-xs">
                            {course}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No courses assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Semesters:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentMentor.semesters && currentMentor.semesters.length > 0 ? (
                        currentMentor.semesters.map((semester, idx) => (
                          <span key={`${semester}-${idx}`} className="bg-muted px-2 py-1 rounded text-xs">
                            {semester}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No semesters assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-sm mt-2">
                    <span className="text-muted-foreground mb-1">Sections:</span>
                    <div className="flex flex-wrap gap-1">
                      {currentMentor.sections && currentMentor.sections.length > 0 ? (
                        currentMentor.sections.map((section, idx) => (
                          <span key={`${section}-${idx}`} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            Section {section}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No sections assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Outpass Statistics</CardTitle>
              </CardHeader>
              
              <CardContent>
                {outpassesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center p-3 bg-yellow-50 rounded-md">
                      <Clock className="h-6 w-6 text-yellow-500 mr-3" />
                      <div>
                        <div className="text-sm text-yellow-700">Pending</div>
                        <div className="text-2xl font-bold text-yellow-800">
                          {pendingOutpasses.length}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-green-50 rounded-md">
                      <CheckCheck className="h-6 w-6 text-green-500 mr-3" />
                      <div>
                        <div className="text-sm text-green-700">Approved</div>
                        <div className="text-2xl font-bold text-green-800">
                          {approvedOutpasses.length}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-red-50 rounded-md">
                      <XCircle className="h-6 w-6 text-red-500 mr-3" />
                      <div>
                        <div className="text-sm text-red-700">Denied</div>
                        <div className="text-2xl font-bold text-red-800">
                          {deniedOutpasses.length}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-md">
                      <div className="text-center mb-2">
                        <div className="text-sm text-blue-700">Total Handled</div>
                        <div className="text-3xl font-bold text-blue-800">
                          {approvedOutpasses.length + deniedOutpasses.length}
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        {(approvedOutpasses.length > 0 || deniedOutpasses.length > 0) && (approvedOutpasses.length + deniedOutpasses.length > 0) ? (
                          <>
                            <div 
                              className="bg-green-500 h-1.5 rounded-l-full" 
                              style={{ 
                                width: `${approvedOutpasses.length / (approvedOutpasses.length + deniedOutpasses.length) * 100}%`,
                                display: 'inline-block'
                              }}
                            ></div>
                            <div 
                              className="bg-red-500 h-1.5 rounded-r-full" 
                              style={{ 
                                width: `${deniedOutpasses.length / (approvedOutpasses.length + deniedOutpasses.length) * 100}%`,
                                display: 'inline-block'
                              }}
                            ></div>
                          </>
                        ) : (
                          <div className="bg-gray-300 h-1.5 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Approved</span>
                        <span>Denied</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {isEditProfileOpen && currentMentor && ( // Ensure currentMentor is available
        <MentorProfileEdit
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          mentor={currentMentor}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
