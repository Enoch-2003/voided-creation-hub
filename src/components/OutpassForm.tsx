
import { useState, useEffect } from "react";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Student, Outpass } from "@/lib/types";
import { format, isToday, setHours, setMinutes, isAfter, isBefore } from "date-fns";

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
  const [currentDate, setCurrentDate] = useState("");
  
  // Set min and max time constraints
  useEffect(() => {
    const today = new Date();
    
    // Format current date for date input (YYYY-MM-DD)
    const formattedDate = format(today, "yyyy-MM-dd");
    setCurrentDate(formattedDate);
    
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
      setExitDateTime(minTime);
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exitDateTime) {
      toast.error("Please select an exit date and time");
      return;
    }
    
    if (!reason) {
      toast.error("Please provide a reason for your outpass request");
      return;
    }
    
    // Validate exit time is within allowed range
    const selectedDateTime = new Date(exitDateTime);
    const today = new Date();
    const selectedDateOnly = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Check if selected date is today
    if (selectedDateOnly.getTime() !== todayDateOnly.getTime()) {
      toast.error("You can only select the current day for exit");
      return;
    }
    
    // Check if selected time is between 9:15 AM and 3:10 PM
    const minTimeDate = new Date(today);
    minTimeDate.setHours(9, 15, 0);
    
    const maxTimeDate = new Date(today);
    maxTimeDate.setHours(15, 10, 0);
    
    const selectedTimeOnly = new Date();
    selectedTimeOnly.setHours(selectedDateTime.getHours(), selectedDateTime.getMinutes(), 0);
    
    if (selectedDateTime.getHours() < 9 || 
        (selectedDateTime.getHours() === 9 && selectedDateTime.getMinutes() < 15) ||
        selectedDateTime.getHours() > 15 ||
        (selectedDateTime.getHours() === 15 && selectedDateTime.getMinutes() > 10)) {
      toast.error("Exit time must be between 9:15 AM and 3:10 PM");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the current serial code prefix from localStorage
      const serialCodeSettings = JSON.parse(localStorage.getItem("serialCodeSettings") || '{"prefix":"XYZ"}');
      const serialNumber = generateId().substring(0, 6).toUpperCase();
      const serialCode = `AUMP-${serialCodeSettings.prefix}-${serialNumber}`;
      
      // Create the outpass request
      const outpassRequest: Outpass = {
        id: generateId(),
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        exitDateTime: exitDateTime,
        reason: reason,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        studentSection: student.section,
        serialCode: serialCode
      };
      
      // Get existing outpasses from localStorage
      const existingOutpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
      
      // Add the new outpass
      const updatedOutpasses = [...existingOutpasses, outpassRequest];
      
      // Save back to localStorage
      localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
      
      // Notify success
      toast.success("Outpass request submitted successfully");
      
      // Reset form
      setExitDateTime("");
      setReason("");
      
      // Call the success callback
      onSuccess();
    } catch (error) {
      toast.error("Failed to submit outpass request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
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
              value={student.enrollmentNumber} 
              disabled 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input 
              id="department" 
              value={student.department} 
              disabled 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input 
              id="section" 
              value={`Section ${student.section}`} 
              disabled 
            />
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
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Outpass Request"}
      </Button>
    </form>
  );
}
