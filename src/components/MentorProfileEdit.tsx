
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mentor } from "@/lib/types";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect, Option } from "@/components/ui/multi-select";

interface MentorProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
}

export default function MentorProfileEdit({ isOpen, onClose, mentor }: MentorProfileEditProps) {
  const { toast } = useToast();
  const [name, setName] = useState(mentor.name || "");
  const [email, setEmail] = useState(mentor.email || "");
  const [department, setDepartment] = useState(mentor.department || "");
  const [contactNumber, setContactNumber] = useState(mentor.contactNumber || "");
  
  // Ensure we have arrays even if they're undefined
  const [branches, setBranches] = useState<string[]>(Array.isArray(mentor.branches) ? [...mentor.branches] : []);
  const [courses, setCourses] = useState<string[]>(Array.isArray(mentor.courses) ? [...mentor.courses] : []);
  const [semesters, setSemesters] = useState<string[]>(Array.isArray(mentor.semesters) ? [...mentor.semesters] : []);
  const [sections, setSections] = useState<string[]>(Array.isArray(mentor.sections) ? [...mentor.sections] : []);
  
  // Update state when mentor prop changes
  useEffect(() => {
    setName(mentor.name || "");
    setEmail(mentor.email || "");
    setDepartment(mentor.department || "");
    setContactNumber(mentor.contactNumber || "");
    setBranches(Array.isArray(mentor.branches) ? [...mentor.branches] : []);
    setCourses(Array.isArray(mentor.courses) ? [...mentor.courses] : []);
    setSemesters(Array.isArray(mentor.semesters) ? [...mentor.semesters] : []);
    setSections(Array.isArray(mentor.sections) ? [...mentor.sections] : []);
  }, [mentor]);
  
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
            branches: Array.isArray(branches) ? branches : [],
            courses: Array.isArray(courses) ? courses : [],
            semesters: Array.isArray(semesters) ? semesters : [],
            sections: Array.isArray(sections) ? sections : [],
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
        branches: Array.isArray(branches) ? branches : [],
        courses: Array.isArray(courses) ? courses : [],
        semesters: Array.isArray(semesters) ? semesters : [],
        sections: Array.isArray(sections) ? sections : [],
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      
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
    }
  };
  
  // Helper function to safely map arrays for MultiSelect
  const mapToOptions = (values: string[] | undefined): Option[] => {
    if (!values || !Array.isArray(values)) return [];
    return values.map(value => ({ label: value, value }));
  };
  
  // Helper function to handle MultiSelect changes
  const handleMultiSelectChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => 
    (options: Option[]) => {
      if (!Array.isArray(options)) {
        setter([]);
        return;
      }
      setter(options.map(item => item.value));
    };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your mentor profile here. Click save when you're done.
          </DialogDescription>
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
              selected={mapToOptions(branches)}
              onChange={handleMultiSelectChange(setBranches)}
              placeholder="Select branches"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="courses">Courses</Label>
            <MultiSelect
              id="courses"
              options={courseOptions}
              selected={mapToOptions(courses)}
              onChange={handleMultiSelectChange(setCourses)}
              placeholder="Select courses"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="semesters">Semesters</Label>
            <MultiSelect
              id="semesters"
              options={semesterOptions}
              selected={mapToOptions(semesters)}
              onChange={handleMultiSelectChange(setSemesters)}
              placeholder="Select semesters"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sections">Sections</Label>
            <MultiSelect
              id="sections"
              options={sectionOptions}
              selected={mapToOptions(sections)}
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
