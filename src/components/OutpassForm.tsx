import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Student, Outpass } from "@/lib/types"; // Removed Mentor as it's not directly used for newOutpass creation here
import { format, isToday, isAfter, isBefore, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz"; 
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

// Indian timezone
const INDIAN_TIMEZONE = 'Asia/Kolkata';

// Convert to Indian time
const toIndianTime = (date: Date | string) => {
  if (typeof date === 'string') {
    return toZonedTime(parseISO(date), INDIAN_TIMEZONE);
  }
  return toZonedTime(date, INDIAN_TIMEZONE);
};

// Format date with Indian timezone
const formatIndianTime = (date: Date | string, formatStr: string) => {
  const indianTime = toIndianTime(date);
  return format(indianTime, formatStr);
};

export function OutpassForm({ student, onSuccess }: OutpassFormProps) {
  const [exitDateTime, setExitDateTime] = useState(""); // Stores datetime-local input string e.g., "2024-05-19T09:15"
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
    const todayInIndia = toZonedTime(new Date(), INDIAN_TIMEZONE);
    
    const formattedDateForInput = format(todayInIndia, "yyyy-MM-dd");
    
    const minTimeDateIndia = new Date(todayInIndia);
    minTimeDateIndia.setHours(9, 15, 0, 0); // 9:15 AM IST
    setMinTime(`${formattedDateForInput}T09:15`);
    
    const maxTimeDateIndia = new Date(todayInIndia);
    maxTimeDateIndia.setHours(15, 10, 0, 0); // 3:10 PM IST
    setMaxTime(`${formattedDateForInput}T15:10`);
    
    const nowInIndia = toZonedTime(new Date(), INDIAN_TIMEZONE);

    // Set default exitDateTime based on current time or minTime
    if (isAfter(nowInIndia, minTimeDateIndia) && isBefore(nowInIndia, maxTimeDateIndia)) {
      const currentHour = format(nowInIndia, 'HH');
      const currentMinute = format(nowInIndia, 'mm');
      setExitDateTime(`${formattedDateForInput}T${currentHour}:${currentMinute}`);
    } else if (isBefore(nowInIndia, minTimeDateIndia)) {
      setExitDateTime(`${formattedDateForInput}T09:15`); // Default to 9:15 AM if before allowed time
    } else {
      // If after 3:10 PM, it should ideally be disabled or handled,
      // for now, let's set it to max time, though validation will catch it.
      // Or better, leave it blank or show an error if submission outside hours isn't allowed.
      // For now, let's keep it to the min time as a fallback if current time is outside range.
      setExitDateTime(`${formattedDateForInput}T09:15`);
    }
    
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
      console.error("Student section is missing for handleSubmit:", student);
      return;
    }

    if (!student.semester) { 
      toast.error("Your semester is not set. Please update your profile before submitting an outpass.");
      console.error("Student semester is missing for handleSubmit:", student);
      return;
    }
    
    // Validate exit time is within allowed range
    const [datePartValidation, timePartValidation] = exitDateTime.split('T');
    const [yearValidation, monthValidation, dayValidation] = datePartValidation.split('-').map(Number);
    const [hourValidation, minuteValidation] = timePartValidation.split(':').map(Number);

    const todayIndianForValidation = toZonedTime(new Date(), INDIAN_TIMEZONE);
    if (
      yearValidation !== todayIndianForValidation.getFullYear() ||
      (monthValidation -1) !== todayIndianForValidation.getMonth() ||
      dayValidation !== todayIndianForValidation.getDate()
    ) {
      toast.error("You can only select the current day (Indian Time) for exit");
      return;
    }
    
    if (hourValidation < 9 || (hourValidation === 9 && minuteValidation < 15) ||
        hourValidation > 15 || (hourValidation === 15 && minuteValidation > 10)) {
      toast.error("Exit time must be between 9:15 AM and 3:10 PM (Indian Time)");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(
        "Attempting to find mentor for student section:", student.section, 
        "and semester:", student.semester
      );
      
      const { data: mentorData, error: mentorCheckError, count } = await supabase
        .from('mentors')
        .select('name, email, contact_number', { count: 'exact' }) 
        .contains('sections', [student.section])
        .contains('semesters', [student.semester]);

      console.log("Mentor query result:", { 
        data: mentorData, 
        error: mentorCheckError, 
        count: count,
        queriedSection: student.section,
        queriedSemester: student.semester
      });

      if (mentorCheckError) {
        console.error("Error checking mentor assignment:", mentorCheckError.message);
        toast.error(`Could not verify mentor assignment: ${mentorCheckError.message}. Please try again.`);
        setIsSubmitting(false);
        return;
      }

      if (!mentorData || mentorData.length === 0) {
        console.warn("No mentor assigned in DB for section:", student.section, "and semester:", student.semester);
        setShowMentorNotAssignedDialog(true);
        setIsSubmitting(false);
        return;
      }
      
      const assignedMentor = mentorData[0];

      if (!assignedMentor) {
        console.error("Assigned mentor is undefined after initial check, this shouldn't happen!");
        toast.error("Critical error: Mentor data is invalid. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      const serialNumber = generateSerialNumber();
      const serialCode = `AUMP-${serialPrefix}-${serialNumber}`;
      
      // --- **MODIFICATION START for exitDateTime storage** ---
      // Student's input from datetime-local (e.g., "2025-05-20T11:15")
      const studentInputExitDateTimeString = exitDateTime; 
      
      // Parse this string. The parts represent the student's local time (assumed IST).
      const [datePart, timePart] = studentInputExitDateTimeString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      
      // Create a Date object representing this local time in IST
      // new Date(year, monthIndex (0-11), day, hour, minute)
      const localDateForIST = new Date(year, month - 1, day, hour, minute);
      
      // Convert this local date (which we know is intended as IST) to a ZonedTime object for IST
      const zonedExitTimeIST = toZonedTime(localDateForIST, INDIAN_TIMEZONE);
      
      // Format this ZonedTime object into an ISO string with the IST offset (+05:30)
      // This is what will be stored in the database.
      const exitDateTimeForDB = format(zonedExitTimeIST, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
      // Example: "2025-05-20T11:15:00.000+05:30"
      // --- **MODIFICATION END for exitDateTime storage** ---

      // For display in the email, format the student's selected time exactly as they see it.
      // This uses the original studentInputExitDateTimeString
      const [datePartDisplay, timePartDisplay] = studentInputExitDateTimeString.split('T');
      const [yearDisplay, monthDisplayStr, dayDisplayStr] = datePartDisplay.split('-');
      const [hourDisplayStr, minuteDisplayStr] = timePartDisplay.split(':');
      
      const studentSelectedDateForEmail = new Date(
        parseInt(yearDisplay), 
        parseInt(monthDisplayStr) - 1, // JS months are 0-indexed
        parseInt(dayDisplayStr), 
        parseInt(hourDisplayStr), 
        parseInt(minuteDisplayStr)
      );
      
      const studentSelectedDisplayTime = format(studentSelectedDateForEmail, "MMMM d, yyyy, h:mm a");
      
      console.log("Formatted student selected exit time for email:", studentSelectedDisplayTime);
      console.log("Student selected exit time string for DB (with IST offset):", exitDateTimeForDB);

      const newOutpass: Outpass = {
        id: crypto.randomUUID(),
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        exitDateTime: exitDateTimeForDB, // Use the IST-offsetted string
        reason: reason.trim(),
        status: "pending",
        createdAt: '', // Placeholder, will be overwritten by useOutpassOperations
        updatedAt: '', // Placeholder, will be overwritten by useOutpassOperations
        studentSection: student.section || '', 
        serialCode: serialCode,
      };
      
      console.log("Creating new outpass (exitDateTime includes IST offset for DB):", newOutpass);
      
      await addOutpass(newOutpass);

      const emailPayload = {
        studentName: student.name,
        // exitDateTimeForReference should remain the student's original local input if the edge function expects that format
        exitDateTimeForReference: studentInputExitDateTimeString, 
        reason: reason.trim(),
        guardianEmail: student.guardianEmail,
        studentSection: student.section,
        mentorName: assignedMentor.name || null,
        mentorEmail: assignedMentor.email || null,
        mentorContact: assignedMentor.contact_number || null,
        formattedExitDateTime: studentSelectedDisplayTime,
      };

      console.log("Sending email with payload (using student's raw local time for reference):", JSON.stringify(emailPayload, null, 2));
      
       const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-guardian-email', {
        body: emailPayload,
      });

      if (emailError) {
        console.error('Error sending guardian email:', emailError);
        toast.error('Failed to send guardian notification email. Your outpass request was still submitted.');
      } else {
        console.log('Guardian email response:', emailResponse);
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
              <Label htmlFor="course">Course</Label>
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
              Date is {exitDateTime ? format(parseISO(exitDateTime.split('T')[0]), "MMMM d, yyyy") : format(toZonedTime(new Date(), INDIAN_TIMEZONE), "MMMM d, yyyy")}. Time is Indian Standard Time.
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
            !student.semester ||
            !exitDateTime
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
