
import { useState } from "react";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Student, Outpass } from "@/lib/types";

interface OutpassFormProps {
  student: Student;
  onSuccess: () => void;
}

export function OutpassForm({ student, onSuccess }: OutpassFormProps) {
  const [exitDateTime, setExitDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    // Check if the date is in the future
    const selectedDateTime = new Date(exitDateTime);
    const now = new Date();
    
    if (selectedDateTime < now) {
      toast.error("The exit date and time must be in the future");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
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
        studentSection: student.section, // Add student section for mentor filtering
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
          <Label htmlFor="exitTime">Exit Date and Time</Label>
          <Input 
            id="exitTime" 
            type="datetime-local" 
            value={exitDateTime}
            onChange={(e) => setExitDateTime(e.target.value)}
            disabled={isSubmitting}
          />
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
