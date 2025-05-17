import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Student, Outpass, Mentor } from "@/lib/types"; // Added Mentor type
import { format, isToday, isAfter, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useOutpassOperations } from "@/hooks/useOutpassOperations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OutpassFormProps {
  student: Student;
  onSuccess: () => void;
}

export function OutpassForm({ student, onSuccess }: OutpassFormProps) {
  const [exitDateTime, setExitDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minTime, setMinTime] = useState("");
  const [maxTime, setMaxTime] = useState("");
  const [serialPrefix, setSerialPrefix] = useState<string>("XYZ");
  const [tabId] = useState(() => crypto.randomUUID());
  const { addOutpass } = useOutpassOperations(tabId);
  const [showMentorNotAssignedDialog, setShowMentorNotAssignedDialog] = useState(false);
  
  useEffect(() => {
    console.log("Student data in OutpassForm:", student);
  }, [student]);
  
  const fetchSerialCodePrefix = async () => {
    try {
      const { data, error } = await supabase
        .from("serial_code_logs")
        .select("prefix")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("Error fetching serial code prefix:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setSerialPrefix(data[0].prefix);
      } else {
        const serialCodeLogs = localStorage.getItem("serialCodeLogs");
        if (serialCodeLogs) {
          try {
            const logs = JSON.parse(serialCodeLogs);
            if (logs && logs.length > 0) {
              const sortedLogs = logs.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              
              if (sortedLogs.length > 0 && sortedLogs[0].prefix) {
                setSerialPrefix(sortedLogs[0].prefix);
              }
            }
          } catch (error_parsing) { 
            console.error("Error parsing serial code logs:", error_parsing);
          }
        }
      }
    } catch (error_fetching) { 
      console.error("Error fetching serial code prefix:", error_fetching);
    }
  };
  
  const generateSerialNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    const today = new Date();
    
    // Format current date for date input (YYYY-MM-DD)
    const formattedDate = format(today, "yyyy-MM-dd");
    
    // Set minimum time (9:15 AM)
    const minTimeDate = new Date(today);
    minTimeDate.setHours(9, 15, 0);
    setMinTime(`${formattedDate}T09:15`);
    
    // Set maximum time (3:10 PM)
    const maxTimeDate = new Date(today);
    maxTimeDate.setHours(15, 10, 0);
    setMaxTime(`${formattedDate}T15:10`);
    
    // If current time is after min time and before max time, set default to current time
    const now = new Date();
    if (isAfter(now, minTimeDate) && isBefore(now, maxTimeDate)) {
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      setExitDateTime(`${formattedDate}T${currentHour}:${currentMinute}`);
    } else {
      // Default to min time if outside the range
      setExitDateTime(`${formattedDate}T09:15`); 
    }
    
    // Fetch the latest serial code prefix
    fetchSerialCodePrefix();
  }, []); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exitDateTime) {
      toast.error("Please select an exit date and time");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Please provide a reason for your outpass request");
      return;
    }
    
    if (!student.enrollmentNumber) {
      toast.error("Student enrollment number is missing");
      console.error("Missing enrollment number for student:", student);
      return;
    }

    if (!student.guardianEmail) {
      toast.error("Guardian email is not configured. Please update your profile.");
      return;
    }

    if (!student.section) {
      toast.error("Your section is not set. Please update your profile before submitting an outpass.");
      return;
    }

    if (!student.semester) { // Added check for semester
      toast.error("Your semester is not set. Please update your profile before submitting an outpass.");
      return;
    }
    
    // Validate exit time is within allowed range
    const selectedDateTime = new Date(exitDateTime);
    const today = new Date();
    const selectedDateOnly = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (selectedDateOnly.getTime() !== todayDateOnly.getTime()) {
      toast.error("You can only select the current day for exit");
      return;
    }
    
    const selectedHour = selectedDateTime.getHours();
    const selectedMinute = selectedDateTime.getMinutes();

    if (selectedHour < 9 || (selectedHour === 9 && selectedMinute < 15) ||
        selectedHour > 15 || (selectedHour === 15 && selectedMinute > 10)) {
      toast.error("Exit time must be between 9:15 AM and 3:10 PM");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check for mentor assignment to the student's section and semester
      const { data: mentorData, error: mentorCheckError, count } = await supabase
        .from('mentors')
        .select('name, email, contact_number', { count: 'exact' }) 
        .contains('sections', [student.section])
        .contains('semesters', [student.semester])
        .limit(1); // Fetch one mentor

      if (mentorCheckError) {
        console.error("Error checking mentor assignment:", mentorCheckError);
        toast.error("Could not verify mentor assignment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (count === 0 || !mentorData || mentorData.length === 0) {
        setShowMentorNotAssignedDialog(true);
        setIsSubmitting(false);
        return;
      }
      
      const assignedMentor = mentorData[0] as { name: string; email: string; contact_number?: string };

      // Generate serial code
      const serialNumber = generateSerialNumber();
      const serialCode = `AUMP-${serialPrefix}-${serialNumber}`;
      
      const now = new Date().toISOString();
      
      const newOutpass: Outpass = {
        id: crypto.randomUUID(),
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        exitDateTime: exitDateTime,
        reason: reason.trim(),
        status: "pending",
        createdAt: now,
        updatedAt: now,
        studentSection: student.section || '', 
        serialCode: serialCode,
      };
      
      console.log("Creating new outpass:", newOutpass);
      
      await addOutpass(newOutpass);

      const emailPayload = {
        studentName: student.name,
        exitDateTime: exitDateTime,
        reason: reason.trim(),
        guardianEmail: student.guardianEmail,
        studentSection: student.section,
        // Pass mentor details
        mentorName: assignedMentor.name || "N/A",
        mentorEmail: assignedMentor.email || "N/A",
        mentorContact: assignedMentor.contact_number || "N/A",
      };

      console.log("Sending email with payload:", emailPayload);

      const { error: emailError } = await supabase.functions.invoke('send-guardian-email', {
        body: emailPayload,
      });

      if (emailError) {
        console.error('Error sending guardian email:', emailError);
        toast.error('Failed to send guardian notification email. Your outpass request was still submitted.');
      } else {
        toast.success('Guardian has been notified via email');
      }
      
      setExitDateTime("");
      setReason("");
      onSuccess();

    } catch (error) {
      console.error("Error submitting outpass:", error);
      toast.error("Failed to submit outpass request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name</Label>
              <Input 
                id="name" 
                value={student.name} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment Number</Label>
              <Input 
                id="enrollment" 
                value={student.enrollmentNumber || 'Not available'} 
                disabled 
              />
              {!student.enrollmentNumber && (
                <p className="text-xs text-red-500">
                  Enrollment number is missing. Please update your profile.
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department" 
                value={student.department || 'N/A'} 
                disabled 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label> {/* Assuming Course is relevant */}
              <Input 
                id="course" 
                value={student.course || 'N/A'} 
                disabled 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input 
                id="semester" 
                value={student.semester || 'N/A'} 
                disabled 
              />
               {!student.semester && (
                <p className="text-xs text-red-500">
                  Semester is not assigned. Please update your profile.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input 
                id="section" 
                value={student.section ? `Section ${student.section}` : 'N/A'} 
                disabled 
              />
               {!student.section && (
                <p className="text-xs text-red-500">
                  Section is not assigned. Please update your profile.
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exitTime">Exit Date and Time (9:15 AM - 3:10 PM today only)</Label>
            <Input 
              id="exitTime" 
              type="datetime-local"
              value={exitDateTime}
              onChange={(e) => setExitDateTime(e.target.value)}
              min={minTime}
              max={maxTime}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              You can only select today's date ({format(new Date(), "MMMM d, yyyy")}) 
              between 9:15 AM and 3:10 PM
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Outpass</Label>
            <Textarea 
              id="reason" 
              placeholder="Please provide a detailed reason for your outpass request"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={
            isSubmitting || 
            !student.enrollmentNumber || 
            !student.guardianEmail || 
            !student.section ||
            !student.semester // Added semester check to disabled state
          }
        >
          {isSubmitting ? "Submitting..." : "Submit Outpass Request"}
        </Button>
      </form>

      <AlertDialog open={showMentorNotAssignedDialog} onOpenChange={setShowMentorNotAssignedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mentor Not Assigned</AlertDialogTitle>
            <AlertDialogDescription>
              A mentor has not yet been assigned to your section (Section {student.section}, Semester {student.semester}). 
              Your outpass request cannot be submitted at this time. Please contact the administration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowMentorNotAssignedDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
