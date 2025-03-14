
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Student, Mentor, UserRole } from "@/lib/types";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [guardianNumber, setGuardianNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);

  const departments = ["ASET", "ABS", "AIB", "AIBP", "AIP", "ALS", "AIBA", "ASCo", "ASFT", "AIS"];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Create user object
    const userData = {
      id: uuidv4(),
      name,
      email,
      password,
      role: userType,
    };
    
    if (userType === "student") {
      // Create student data
      const studentData: Student = {
        ...userData,
        role: "student",
        enrollmentNumber,
        contactNumber,
        guardianNumber,
        department,
        course,
        branch,
        semester,
        section,
      };
      
      // Get existing users or initialize empty array
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Add new student
      localStorage.setItem("users", JSON.stringify([...existingUsers, studentData]));
      
      toast.success("Student registration successful!");
    } else {
      // Create mentor data
      const mentorData: Mentor = {
        ...userData,
        role: "mentor",
        department,
        branches: branches,
        courses: courses,
        semesters: semesters,
        sections: sections,
      };
      
      // Get existing users or initialize empty array
      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Add new mentor
      localStorage.setItem("users", JSON.stringify([...existingUsers, mentorData]));
      
      toast.success("Mentor registration successful!");
    }
    
    // Redirect to login
    navigate("/login");
  };
  
  // Handle multi-select for mentor fields
  const handleMultiSelect = (value: string, stateArray: string[], setStateArray: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (stateArray.includes(value)) {
      setStateArray(stateArray.filter(item => item !== value));
    } else {
      setStateArray([...stateArray, value]);
    }
  };
  
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Register as a student or mentor to use AmiPass
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister}>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={userType === "student" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setUserType("student")}
                >
                  Student
                </Button>
                <Button
                  type="button"
                  variant={userType === "mentor" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setUserType("mentor")}
                >
                  Mentor
                </Button>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              
              {userType === "student" ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="enrollmentNo">Enrollment Number</Label>
                    <Input
                      id="enrollmentNo"
                      placeholder="Enter enrollment number"
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contact">Contact Number</Label>
                      <Input
                        id="contact"
                        placeholder="Your phone number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="guardian">Guardian Number</Label>
                      <Input
                        id="guardian"
                        placeholder="Guardian's phone"
                        value={guardianNumber}
                        onChange={(e) => setGuardianNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        placeholder="E.g., B.Tech"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="E.g., CSE"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Input
                        id="semester"
                        placeholder="E.g., 5"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        placeholder="E.g., A"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Mentor-specific fields
                <>
                  <div className="grid gap-2">
                    <Label>Branches (Select multiple)</Label>
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
                    <Label>Courses (Select multiple)</Label>
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
                    <Label>Semesters (Select multiple)</Label>
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
                    <Label>Sections (Select multiple)</Label>
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
                </>
              )}
            </div>
            
            <Button className="w-full mt-6" type="submit">
              Register
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="px-0"
            onClick={() => navigate("/login")}
          >
            Already have an account? Log in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
