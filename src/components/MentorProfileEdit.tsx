import { useState } from "react";
import { Mentor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface MentorProfileEditProps {
  mentor: Mentor;
  onUpdate: (updatedMentor: Mentor) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function MentorProfileEdit({ mentor, onUpdate, isOpen, onClose }: MentorProfileEditProps) {
  const [name, setName] = useState(mentor.name);
  const [email, setEmail] = useState(mentor.email);
  const [department, setDepartment] = useState(mentor.department);
  const [branches, setBranches] = useState<string[]>(mentor.branches || []);
  const [courses, setCourses] = useState<string[]>(mentor.courses || []);
  const [semesters, setSemesters] = useState<string[]>(mentor.semesters || []);
  const [sections, setSections] = useState<string[]>(mentor.sections || []);
  const [internalOpen, setInternalOpen] = useState(false);

  const departments = ["ASET", "ABS", "AIB", "AIBP", "AIP", "ALS", "AIBA", "ASCo", "ASFT", "AIS"];

  const dialogOpen = isOpen !== undefined ? isOpen : internalOpen;
  const setDialogOpen = (value: boolean) => {
    if (isOpen !== undefined && onClose) {
      if (!value) onClose();
    } else {
      setInternalOpen(value);
    }
  };

  const handleMultiSelect = (value: string, stateArray: string[], setStateArray: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (stateArray.includes(value)) {
      setStateArray(stateArray.filter(item => item !== value));
    } else {
      setStateArray([...stateArray, value]);
    }
  };

  const handleSubmit = () => {
    if (!name || !email || !department) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (branches.length === 0 || courses.length === 0 || semesters.length === 0 || sections.length === 0) {
      toast.error("Please select at least one option for each category");
      return;
    }

    const updatedMentor: Mentor = {
      ...mentor,
      name,
      email,
      department,
      branches,
      courses,
      semesters,
      sections,
    };

    const mentors = JSON.parse(localStorage.getItem("mentors") || "[]");
    const updatedMentors = mentors.map((m: Mentor) => (m.id === mentor.id ? updatedMentor : m));
    localStorage.setItem("mentors", JSON.stringify(updatedMentors));
    
    sessionStorage.setItem("currentUser", JSON.stringify(updatedMentor));

    onUpdate(updatedMentor);
    
    toast.success("Profile updated successfully");
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isOpen && (
        <DialogTrigger asChild>
          <Button variant="outline">Edit Profile</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Mentor Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and the classes you mentor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label>Branches You Mentor</Label>
            <div className="flex flex-wrap gap-2">
              {["CSE", "ECE", "ME", "CE", "EEE", "IT"].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={branches.includes(option) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMultiSelect(option, branches, setBranches)}
                  className="mb-2"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Courses You Mentor</Label>
            <div className="flex flex-wrap gap-2">
              {["B.Tech", "M.Tech", "BCA", "MCA", "BBA", "MBA"].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={courses.includes(option) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMultiSelect(option, courses, setCourses)}
                  className="mb-2"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Semesters You Mentor</Label>
            <div className="flex flex-wrap gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8"].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={semesters.includes(option) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMultiSelect(option, semesters, setSemesters)}
                  className="mb-2"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Sections You Mentor</Label>
            <div className="flex flex-wrap gap-2">
              {["A", "B", "C", "D", "E", "F"].map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={sections.includes(option) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMultiSelect(option, sections, setSections)}
                  className="mb-2"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
