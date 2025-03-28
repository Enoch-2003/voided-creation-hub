import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Student, Mentor } from "@/lib/types";
import { departments, courses, branches, semesters, sections } from "@/lib/constants";

export default function Register() {
  const [isStudent, setIsStudent] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enrollmentNumber, setEnrollmentNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  // For mentors, we'll use single selections for now since the Select component doesn't support multiple
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    const hashedPassword = await bcrypt(password);
    
    if (isStudent) {
      if (!name || !email || !password || !confirmPassword || !enrollmentNumber || !contactNumber || !guardianEmail || !department || !course || !branch || !semester || !section) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      const studentData: Student = {
        id: crypto.randomUUID(),
        role: 'student',
        name,
        email,
        enrollmentNumber,
        contactNumber,
        guardianEmail,
        department,
        course,
        branch,
        semester,
        section,
        password: hashedPassword
      };
      
      let users = JSON.parse(localStorage.getItem("users") || "[]");
      users.push(studentData);
      localStorage.setItem("users", JSON.stringify(users));
      
      toast({
        title: "Success",
        description: "Registration successful! Redirecting to login...",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      if (!name || !email || !password || !confirmPassword || !department || !contactNumber || !selectedBranch || !selectedCourse || !selectedSemester || !selectedSection) {
        toast({
          title: "Error",
          description: "Please fill in all required fields for mentors.",
          variant: "destructive",
        });
        return;
      }
      
      const mentorData: Mentor = {
        id: crypto.randomUUID(),
        role: 'mentor',
        name,
        email,
        department,
        contactNumber,
        // Convert single selections to arrays as required by the Mentor type
        branches: [selectedBranch],
        courses: [selectedCourse],
        semesters: [selectedSemester],
        sections: [selectedSection],
        password: hashedPassword
      };
      
      let users = JSON.parse(localStorage.getItem("users") || "[]");
      users.push(mentorData);
      localStorage.setItem("users", JSON.stringify(users));
      
      toast({
        title: "Success",
        description: "Mentor registration successful! Redirecting to login...",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };
  
  const bcrypt = async (password: string): Promise<string> => {
    const saltRounds = 10;
    const salt = await new Promise<string>((resolve, reject) => {
      window.crypto.subtle.generateKey(
        {
          name: "PBKDF2",
          hash: "SHA-256",
          length: 256
        },
        true,
        ["deriveKey", "deriveBits"]
      ).then(key => {
        window.crypto.subtle.exportKey("raw", key).then(exportedKey => {
          const saltArray = new Uint8Array(exportedKey as ArrayBuffer);
          const saltHexCodes = [];
          for (let i = 0; i < saltArray.length; i++) {
            const hexCode = saltArray[i].toString(16);
            const paddedHexCode = hexCode.padStart(2, '0');
            saltHexCodes.push(paddedHexCode);
          }
          const salt = saltHexCodes.join('');
          resolve(salt);
        }).catch(reject);
      }).catch(reject);
    });
    
    const passwordBytes = new TextEncoder().encode(password);
    const saltBytes = new TextEncoder().encode(salt);
    
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: saltRounds,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const hashedPasswordArray = new Uint8Array(exportedKey as ArrayBuffer);
    const hashedPasswordHexCodes = [];
    for (let i = 0; i < hashedPasswordArray.length; i++) {
      const hexCode = hashedPasswordArray[i].toString(16);
      const paddedHexCode = hexCode.padStart(2, '0');
      hashedPasswordHexCodes.push(paddedHexCode);
    }
    const hashedPassword = hashedPasswordHexCodes.join('');
    
    return hashedPassword;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isStudent ? "Student Registration" : "Mentor Registration"}
            </CardTitle>
            <CardDescription>
              Create a new account to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              {isStudent ? (
                <>
                  <div>
                    <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                    <Input
                      id="enrollmentNumber"
                      type="text"
                      placeholder="Enter your enrollment number"
                      required
                      value={enrollmentNumber}
                      onChange={(e) => setEnrollmentNumber(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="Enter your contact number"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Guardian Email</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      placeholder="Enter guardian email address"
                      required
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={setDepartment} defaultValue={department}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a department" />
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
                  
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Select onValueChange={setCourse} defaultValue={course}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Select onValueChange={setBranch} defaultValue={branch}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select onValueChange={setSemester} defaultValue={semester}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Select onValueChange={setSection} defaultValue={section}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((sec) => (
                          <SelectItem key={sec} value={sec}>
                            {sec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="contactNumber">Official Contact Number</Label>
                    <Input
                      id="contactNumber"
                      type="tel"
                      placeholder="Enter your contact number"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={setDepartment} defaultValue={department}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a department" />
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
                  
                  <div>
                    <Label>Branch</Label>
                    <Select onValueChange={setSelectedBranch} defaultValue={selectedBranch}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Course</Label>
                    <Select onValueChange={setSelectedCourse} defaultValue={selectedCourse}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Semester</Label>
                    <Select onValueChange={setSelectedSemester} defaultValue={selectedSemester}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Section</Label>
                    <Select onValueChange={setSelectedSection} defaultValue={selectedSection}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <Button type="submit" className="w-full">
                Register
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm">
          {isStudent ? (
            <>
              Already have an account?{" "}
              <Button variant="link" onClick={() => navigate("/login")}>
                Login
              </Button>
            </>
          ) : (
            <>
              Already a mentor?{" "}
              <Button variant="link" onClick={() => navigate("/login")}>
                Login
              </Button>
            </>
          )}
        </div>
        
        <div className="text-center text-sm">
          Register as a{" "}
          <Button variant="link" onClick={() => setIsStudent(!isStudent)}>
            {isStudent ? "Mentor" : "Student"}
          </Button>
        </div>
      </div>
    </div>
  );
}
