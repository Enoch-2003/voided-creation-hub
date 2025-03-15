
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mentor } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface MentorProfileEditProps {
  mentor: Mentor;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updatedMentor: Mentor) => void;
}

export function MentorProfileEdit({ mentor, isOpen, onClose, onUpdateProfile }: MentorProfileEditProps) {
  const [name, setName] = useState(mentor.name);
  const [email, setEmail] = useState(mentor.email);
  const [department, setDepartment] = useState(mentor.department);
  const [sections, setSections] = useState<string[]>(mentor.sections || ["A"]);
  const [branches, setBranches] = useState<string[]>(mentor.branches || ["Computer Science"]);
  const [courses, setCourses] = useState<string[]>(mentor.courses || ["B.Tech"]);
  const [semesters, setSemesters] = useState<string[]>(mentor.semesters || ["1"]);
  
  // Department options
  const departmentOptions = [
    "ASET", "ABS", "AIB", "AIBP", "AIP", "ALS", "AIBA", "ASCo", "ASFT", "AIS"
  ];
  
  const handleSectionToggle = (section: string) => {
    setSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };
  
  const handleBranchToggle = (branch: string) => {
    setBranches(prev => 
      prev.includes(branch) 
        ? prev.filter(b => b !== branch) 
        : [...prev, branch]
    );
  };
  
  const handleCourseToggle = (course: string) => {
    setCourses(prev => 
      prev.includes(course) 
        ? prev.filter(c => c !== course) 
        : [...prev, course]
    );
  };
  
  const handleSemesterToggle = (semester: string) => {
    setSemesters(prev => 
      prev.includes(semester) 
        ? prev.filter(s => s !== semester) 
        : [...prev, semester]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !department || sections.length === 0) {
      toast.error("Please fill in all required fields and select at least one section");
      return;
    }
    
    // Update mentor profile
    const updatedMentor: Mentor = {
      ...mentor,
      name,
      email,
      department,
      sections,
      branches,
      courses,
      semesters,
    };
    
    // Save to localStorage and update state
    onUpdateProfile(updatedMentor);
    
    // Close dialog
    onClose();
    
    // Show success toast
    toast.success("Profile updated successfully!");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mentor-name">Full Name</Label>
            <Input
              id="mentor-name"
              placeholder="Dr. Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mentor-email">Email Address</Label>
            <Input
              id="mentor-email"
              type="email"
              placeholder="jane.smith@amity.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mentor-department">Department</Label>
            <Select 
              value={department} 
              onValueChange={setDepartment}
            >
              <SelectTrigger id="mentor-department">
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
              {["A", "B", "C"].map(section => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`section-${section}`}
                    checked={sections.includes(section)}
                    onCheckedChange={() => handleSectionToggle(section)}
                  />
                  <label 
                    htmlFor={`section-${section}`}
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
              {["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"].map(branch => (
                <div key={branch} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`branch-${branch}`}
                    checked={branches.includes(branch)}
                    onCheckedChange={() => handleBranchToggle(branch)}
                  />
                  <label 
                    htmlFor={`branch-${branch}`}
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
              {["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc"].map(course => (
                <div key={course} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`course-${course}`}
                    checked={courses.includes(course)}
                    onCheckedChange={() => handleCourseToggle(course)}
                  />
                  <label 
                    htmlFor={`course-${course}`}
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
                    id={`semester-${semester}`}
                    checked={semesters.includes(semester)}
                    onCheckedChange={() => handleSemesterToggle(semester)}
                  />
                  <label 
                    htmlFor={`semester-${semester}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sem {semester}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
