
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mentor } from "@/lib/types";
import { toast } from "sonner";
import storageSync from "@/lib/storageSync";

type MentorProfileEditProps = {
  isOpen: boolean;
  onClose: () => void;
  mentor: Mentor;
  onUpdate: (updatedMentor: Mentor) => void;
};

export function MentorProfileEdit({ isOpen, onClose, mentor, onUpdate }: MentorProfileEditProps) {
  const [mentorDepartment, setMentorDepartment] = useState(mentor.department);
  const [mentorSections, setMentorSections] = useState<string[]>(mentor.sections);
  const [mentorBranches, setMentorBranches] = useState<string[]>(mentor.branches);
  const [mentorCourses, setMentorCourses] = useState<string[]>(mentor.courses);
  const [mentorSemesters, setMentorSemesters] = useState<string[]>(mentor.semesters);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset form state when mentor data changes
    setMentorDepartment(mentor.department);
    setMentorSections(mentor.sections);
    setMentorBranches(mentor.branches);
    setMentorCourses(mentor.courses);
    setMentorSemesters(mentor.semesters);
  }, [mentor, isOpen]);

  const handleSectionToggle = (section: string) => {
    setMentorSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };
  
  const handleBranchToggle = (branch: string) => {
    setMentorBranches(prev => 
      prev.includes(branch) 
        ? prev.filter(b => b !== branch) 
        : [...prev, branch]
    );
  };
  
  const handleCourseToggle = (course: string) => {
    setMentorCourses(prev => 
      prev.includes(course) 
        ? prev.filter(c => c !== course) 
        : [...prev, course]
    );
  };
  
  const handleSemesterToggle = (semester: string) => {
    setMentorSemesters(prev => 
      prev.includes(semester) 
        ? prev.filter(s => s !== semester) 
        : [...prev, semester]
    );
  };

  const handleSubmit = () => {
    if (mentorSections.length === 0) {
      toast.error("Please select at least one section to mentor");
      return;
    }

    setIsLoading(true);

    try {
      // Create updated mentor with new values
      const updatedMentor: Mentor = {
        ...mentor,
        department: mentorDepartment,
        sections: mentorSections,
        branches: mentorBranches,
        courses: mentorCourses,
        semesters: mentorSemesters,
      };
      
      // Update in local storage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map((user: any) => 
        user.id === mentor.id ? updatedMentor : user
      );
      
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Update current session user if this is the logged-in user
      const currentUser = storageSync.getUser();
      if (currentUser && currentUser.id === mentor.id) {
        storageSync.setUser(updatedMentor);
      }
      
      // Notify the parent component
      onUpdate(updatedMentor);
      
      toast.success("Profile updated successfully");
      onClose();
    } catch (error) {
      toast.error("An error occurred while updating profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Department options based on the new requirements
  const departmentOptions = [
    "ASET", "ABS", "AIB", "AIBP", "AIP", "ALS", "AIBA", "ASCo", "ASFT", "AIS"
  ];

  // Branch options
  const branchOptions = [
    "Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"
  ];

  // Course options
  const courseOptions = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc"];

  // Section options
  const sectionOptions = ["A", "B", "C"];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Mentor Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select 
              value={mentorDepartment} 
              onValueChange={setMentorDepartment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Sections You Mentor</Label>
            <div className="grid grid-cols-3 gap-4 pt-1">
              {sectionOptions.map(section => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-section-${section}`}
                    checked={mentorSections.includes(section)}
                    onCheckedChange={() => handleSectionToggle(section)}
                  />
                  <label 
                    htmlFor={`edit-section-${section}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Section {section}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Branches You Handle</Label>
            <div className="grid grid-cols-2 gap-4 pt-1">
              {branchOptions.map(branch => (
                <div key={branch} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-branch-${branch}`}
                    checked={mentorBranches.includes(branch)}
                    onCheckedChange={() => handleBranchToggle(branch)}
                  />
                  <label 
                    htmlFor={`edit-branch-${branch}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {branch}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Courses You Teach</Label>
            <div className="grid grid-cols-3 gap-4 pt-1">
              {courseOptions.map(course => (
                <div key={course} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-course-${course}`}
                    checked={mentorCourses.includes(course)}
                    onCheckedChange={() => handleCourseToggle(course)}
                  />
                  <label 
                    htmlFor={`edit-course-${course}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {course}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Semesters You Handle</Label>
            <div className="grid grid-cols-4 gap-4 pt-1">
              {Array.from({ length: 8 }, (_, i) => String(i + 1)).map(semester => (
                <div key={semester} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-semester-${semester}`}
                    checked={mentorSemesters.includes(semester)}
                    onCheckedChange={() => handleSemesterToggle(semester)}
                  />
                  <label 
                    htmlFor={`edit-semester-${semester}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sem {semester}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
