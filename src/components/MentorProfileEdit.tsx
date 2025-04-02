
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mentor } from "@/lib/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MentorProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  onProfileUpdate?: (updatedMentor: Mentor) => void;
}

export default function MentorProfileEdit({ isOpen, onClose, mentor, onProfileUpdate }: MentorProfileEditProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Convert arrays to comma-separated strings for easier editing
  const [branchesText, setBranchesText] = useState("");
  const [coursesText, setCoursesText] = useState("");
  const [semestersText, setSemestersText] = useState("");
  const [sectionsText, setSectionsText] = useState("");
  
  // Update state when mentor prop changes
  useEffect(() => {
    if (mentor) {
      setName(mentor.name || "");
      setEmail(mentor.email || "");
      setDepartment(mentor.department || "");
      setContactNumber(mentor.contactNumber || "");
      
      // Convert arrays to comma-separated strings
      setBranchesText(Array.isArray(mentor.branches) ? mentor.branches.join(", ") : "");
      setCoursesText(Array.isArray(mentor.courses) ? mentor.courses.join(", ") : "");
      setSemestersText(Array.isArray(mentor.semesters) ? mentor.semesters.join(", ") : "");
      setSectionsText(Array.isArray(mentor.sections) ? mentor.sections.join(", ") : "");
    }
  }, [mentor]);
  
  // Helper function to convert comma-separated string to array and trim whitespace
  const stringToArray = (str: string): string[] => {
    if (!str || str.trim() === "") return [];
    return str.split(",").map(item => item.trim()).filter(item => item !== "");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert comma-separated strings back to arrays
      const branches = stringToArray(branchesText);
      const courses = stringToArray(coursesText);
      const semesters = stringToArray(semestersText);
      const sections = stringToArray(sectionsText);
      
      // Create updated mentor object
      const updatedMentor: Mentor = {
        ...mentor,
        name,
        email,
        department,
        contactNumber,
        branches,
        courses,
        semesters,
        sections,
      };
      
      // Update directly in Supabase database
      const { error } = await supabase
        .from('mentors')
        .update({
          name,
          email,
          department,
          contact_number: contactNumber,
          branches,
          courses,
          semesters,
          sections
        })
        .eq('id', mentor.id);
      
      if (error) throw error;
      
      // Update session storage for this tab
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      if (currentUser && currentUser.id === mentor.id) {
        sessionStorage.setItem("user", JSON.stringify(updatedMentor));
      }
      
      // Call the onProfileUpdate callback with the updated mentor data
      if (onProfileUpdate) {
        onProfileUpdate(updatedMentor);
      }
      
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription id="profile-edit-description">
            Make changes to your mentor profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
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
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enter your department"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter your contact number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branches">Branches (comma separated)</Label>
            <Input
              id="branches"
              value={branchesText}
              onChange={(e) => setBranchesText(e.target.value)}
              placeholder="Example: CSE, IT, ECE"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="courses">Courses (comma separated)</Label>
            <Input
              id="courses"
              value={coursesText}
              onChange={(e) => setCoursesText(e.target.value)}
              placeholder="Example: BTech, MTech"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="semesters">Semesters (comma separated)</Label>
            <Input
              id="semesters"
              value={semestersText}
              onChange={(e) => setSemestersText(e.target.value)}
              placeholder="Example: 1, 2, 3"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sections">Sections (comma separated)</Label>
            <Input
              id="sections"
              value={sectionsText}
              onChange={(e) => setSectionsText(e.target.value)}
              placeholder="Example: A, B, C"
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
