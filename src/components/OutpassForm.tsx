
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Student, Outpass } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface OutpassFormProps {
  student: Student;
  onSuccess: () => void;
}

export function OutpassForm({ student, onSuccess }: OutpassFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Combine date and time into a single Date object
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const [exitDate, setExitDate] = useState<Date>(tomorrow);
  const [exitTime, setExitTime] = useState<string>("10:00");
  const [reason, setReason] = useState<string>("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exitDate || !exitTime || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create exit date time by combining date and time
      const [hours, minutes] = exitTime.split(":").map(Number);
      const exitDateTime = new Date(exitDate);
      exitDateTime.setHours(hours, minutes, 0, 0);
      
      // Create new outpass
      const newOutpass: Outpass = {
        id: generateId(),
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        exitDateTime: exitDateTime.toISOString(),
        reason: reason.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Get existing outpasses from localStorage
      const existingOutpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
      
      // Add new outpass
      const updatedOutpasses = [...existingOutpasses, newOutpass];
      
      // Save to localStorage
      localStorage.setItem("outpasses", JSON.stringify(updatedOutpasses));
      
      // Call success callback
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your outpass request. Please try again.",
        variant: "destructive",
      });
      console.error("Error submitting outpass:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="student-name">Student Name</Label>
            <Input
              id="student-name"
              value={student.name}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="enrollment-number">Enrollment Number</Label>
            <Input
              id="enrollment-number"
              value={student.enrollmentNumber}
              disabled
              className="bg-muted"
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
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course">Course & Semester</Label>
            <Input
              id="course"
              value={`${student.course} - Semester ${student.semester}`}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="exit-date">Exit Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !exitDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {exitDate ? format(exitDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={exitDate}
                  onSelect={(date) => date && setExitDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exit-time">Exit Time</Label>
            <Input
              id="exit-time"
              type="time"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reason">
            Reason for Leaving Campus <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Please provide a detailed reason for your outpass request"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            required
          />
          <p className="text-xs text-muted-foreground">
            Be specific and clear about your reason. This helps your mentor make an informed decision.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Outpass Request"
          )}
        </Button>
      </div>
    </form>
  );
}
