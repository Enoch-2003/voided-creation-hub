import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Student, OutpassDB } from "@/lib/types";
import { format, isToday, isAfter, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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
  const [serialPrefix, setSerialPrefix] = useState<string>("XYZ");
  
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
    
    // Fetch the latest serial code prefix
    fetchSerialCodePrefix();
  }, [minTime]);
  
  // Fetch the latest serial code prefix from database
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
      }
    } catch (error) {
      console.error("Error fetching serial code prefix:", error);
    }
  };
  
  const generateSerialNumber = () => {
    // Generate a random 6-character alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
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
      // Generate serial code
      const serialNumber = generateSerialNumber();
      const serialCode = `AUMP-${serialPrefix}-${serialNumber}`;
      
      // Create the outpass request using the DB schema format
      const outpassRequest: OutpassDB = {
        id: crypto.randomUUID(),
        student_id: student.id,
        student_name: student.name,
        enrollment_number: student.enrollmentNumber,
        exit_date_time: exitDateTime,
        reason: reason,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        student_section: student.section || '',
        serial_code: serialCode
      };
      
      // Save to database
      const { error } = await supabase
        .from("outpasses")
        .insert(outpassRequest);
      
      if (error) throw error;
      
      // Notify success
      toast.success("Outpass request submitted successfully");
      
      // Reset form
      setExitDateTime("");
      setReason("");
      
      // Call the success callback
      onSuccess();
    } catch (error) {
      console.error("Error submitting outpass:", error);
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
              value={student.department || ''} 
              disabled 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input 
              id="section" 
              value={`Section ${student.section || ''}`} 
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
