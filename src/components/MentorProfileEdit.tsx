
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mentor } from "@/lib/types";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";

interface MentorProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
}

export default function MentorProfileEdit({ isOpen, onClose, mentor }: MentorProfileEditProps) {
  const { toast } = useToast();
  const [name, setName] = useState(mentor.name);
  const [email, setEmail] = useState(mentor.email);
  const [department, setDepartment] = useState(mentor.department);
  const [contactNumber, setContactNumber] = useState(mentor.contactNumber || "");
  const [branches, setBranches] = useState<string[]>(mentor.branches || []);
  const [courses, setCourses] = useState<string[]>(mentor.courses || []);
  const [semesters, setSemesters] = useState<string[]>(mentor.semesters || []);
  const [sections, setSections] = useState<string[]>(mentor.sections || []);
  
  // Options for the multi-select fields
  const branchOptions = ["CSE", "IT", "ECE", "ME", "CE", "EEE", "BBA", "MBA", "BCA"].map(branch => ({
    label: branch,
    value: branch
  }));
  
  const courseOptions = ["BTech", "MTech", "BBA", "MBA", "BCA", "MCA"].map(course => ({
    label: course,
    value: course
  }));
  
  const semesterOptions = ["1", "2", "3", "4", "5", "6", "7", "8"].map(sem => ({
    label: sem,
    value: sem
  }));
  
  const sectionOptions = ["A", "B", "C", "D", "E", "F"].map(section => ({
    label: section,
    value: section
  }));
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get all users from localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Update the mentor's information
      const updatedUsers = users.map((user: any) => {
        if (user.id === mentor.id) {
          return {
            ...user,
            name,
            email,
            department,
            contactNumber,
            branches,
            courses,
            semesters,
            sections,
          };
        }
        return user;
      });
      
      // Save back to localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Update session storage
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        name,
        email,
        department,
        contactNumber,
        branches,
        courses,
        semesters,
        sections,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      
      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to handle string array updates for MultiSelect
  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => 
    (value: { label: string; value: string }[]) => {
      setter(value.map(item => item.value));
    };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
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
            <Label htmlFor="branches">Branches</Label>
            <MultiSelect
              id="branches"
              options={branchOptions}
              selected={branches.map(branch => ({ label: branch, value: branch }))}
              onChange={handleMultiSelectChange(setBranches)}
              placeholder="Select branches"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="courses">Courses</Label>
            <MultiSelect
              id="courses"
              options={courseOptions}
              selected={courses.map(course => ({ label: course, value: course }))}
              onChange={handleMultiSelectChange(setCourses)}
              placeholder="Select courses"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="semesters">Semesters</Label>
            <MultiSelect
              id="semesters"
              options={semesterOptions}
              selected={semesters.map(sem => ({ label: sem, value: sem }))}
              onChange={handleMultiSelectChange(setSemesters)}
              placeholder="Select semesters"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sections">Sections</Label>
            <MultiSelect
              id="sections"
              options={sectionOptions}
              selected={sections.map(section => ({ label: section, value: section }))}
              onChange={handleMultiSelectChange(setSections)}
              placeholder="Select sections"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
