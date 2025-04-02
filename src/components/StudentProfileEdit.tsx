
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Student } from "@/lib/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onProfileUpdate?: (updatedStudent: Student) => void;
}

export default function StudentProfileEdit({ isOpen, onClose, student, onProfileUpdate }: StudentProfileEditProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update state when student prop changes
  useEffect(() => {
    if (student) {
      setName(student.name || "");
      setEmail(student.email || "");
      setEnrollmentNumber(student.enrollmentNumber || "");
      setDepartment(student.department || "");
      setCourse(student.course || "");
      setBranch(student.branch || "");
      setSemester(student.semester || "");
      setSection(student.section || "");
      setContactNumber(student.contactNumber || "");
      setGuardianEmail(student.guardianEmail || "");
    }
  }, [student]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create updated student object
      const updatedStudent: Student = {
        ...student,
        name,
        email,
        enrollmentNumber,
        department,
        course,
        branch,
        semester,
        section,
        contactNumber,
        guardianEmail
      };
      
      // Update directly in Supabase database
      const { error } = await supabase
        .from('students')
        .update({
          name,
          email,
          enrollment_number: enrollmentNumber,
          department,
          course,
          branch,
          semester,
          section,
          contact_number: contactNumber,
          guardian_email: guardianEmail
        })
        .eq('id', student.id);
      
      if (error) throw error;
      
      // Call the onProfileUpdate callback with the updated student data
      if (onProfileUpdate) {
        onProfileUpdate(updatedStudent);
      }
      
      toast({
        title: "Success",
        description: `Student ${name}'s profile has been updated.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating student profile:", error);
      toast({
        title: "Error",
        description: "Failed to update student profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto my-4" aria-describedby="profile-edit-description">
        <DialogHeader>
          <DialogTitle>Edit Student Profile</DialogTitle>
          <DialogDescription id="profile-edit-description">
            Make changes to the student profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
            <Input
              id="enrollmentNumber"
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value)}
              placeholder="Enter enrollment number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter department"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Enter course"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Enter branch"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Enter semester"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Enter section"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter contact number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Guardian Email</Label>
            <Input
              id="guardianEmail"
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              placeholder="Enter guardian email"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
