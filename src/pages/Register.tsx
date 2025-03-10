
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";

const studentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  guardianNumber: z.string().min(10, "Guardian number must be at least 10 digits"),
  department: z.string().min(1, "Department is required"),
  course: z.string().min(1, "Course is required"),
  branch: z.string().min(1, "Branch is required"),
  semester: z.string().min(1, "Semester is required"),
  section: z.string().min(1, "Section is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const mentorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register() {
  const [activeTab, setActiveTab] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      enrollmentNumber: "",
      email: "",
      contactNumber: "",
      guardianNumber: "",
      department: "",
      course: "",
      branch: "",
      semester: "",
      section: "",
      password: "",
      confirmPassword: "",
    },
  });

  const mentorForm = useForm<z.infer<typeof mentorSchema>>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onStudentSubmit = async (data: z.infer<typeof studentSchema>) => {
    setIsLoading(true);
    
    try {
      // For now, simulate registration with localStorage
      const newStudent = {
        id: generateId(),
        name: data.name,
        email: data.email,
        role: "student" as const,
        enrollmentNumber: data.enrollmentNumber,
        contactNumber: data.contactNumber,
        guardianNumber: data.guardianNumber,
        department: data.department,
        course: data.course,
        branch: data.branch,
        semester: data.semester,
        section: data.section,
      };
      
      // Get existing students or initialize empty array
      const existingStudents = JSON.parse(localStorage.getItem("students") || "[]");
      
      // Check if enrollment number already exists
      if (existingStudents.some((s: any) => s.enrollmentNumber === data.enrollmentNumber)) {
        toast({
          title: "Registration failed",
          description: "Enrollment number already registered",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Add new student to array
      existingStudents.push(newStudent);
      
      // Save updated array back to localStorage
      localStorage.setItem("students", JSON.stringify(existingStudents));
      
      toast({
        title: "Registration successful",
        description: "You can now login with your credentials",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onMentorSubmit = async (data: z.infer<typeof mentorSchema>) => {
    setIsLoading(true);
    
    try {
      // For now, simulate registration with localStorage
      const newMentor = {
        id: generateId(),
        name: data.name,
        email: data.email,
        role: "mentor" as const,
        department: data.department,
        branches: ["Computer Science", "Information Technology"], // Default values for now
        courses: ["B.Tech", "M.Tech"], // Default values for now
        semesters: ["3", "4", "5"], // Default values for now
        sections: ["A", "B"], // Default values for now
      };
      
      // Get existing mentors or initialize empty array
      const existingMentors = JSON.parse(localStorage.getItem("mentors") || "[]");
      
      // Check if email already exists
      if (existingMentors.some((m: any) => m.email === data.email)) {
        toast({
          title: "Registration failed",
          description: "Email already registered",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Add new mentor to array
      existingMentors.push(newMentor);
      
      // Save updated array back to localStorage
      localStorage.setItem("mentors", JSON.stringify(existingMentors));
      
      toast({
        title: "Registration successful",
        description: "You can now login with your credentials",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amiblue-400 to-amiblue-600 flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white font-semibold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-display font-bold mt-4">Create an Account</h1>
            <p className="text-muted-foreground mt-2">
              Register as a student or mentor to use AmiPass
            </p>
          </div>
          
          <Card className="animate-scale-up">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display">Register</CardTitle>
              <CardDescription>
                Choose your role to create an account
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="student" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="student">Student</TabsTrigger>
                  <TabsTrigger value="mentor">Mentor</TabsTrigger>
                </TabsList>
              </div>
              
              <CardContent className="pt-6">
                <TabsContent value="student" className="mt-0">
                  <Form {...studentForm}>
                    <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={studentForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="enrollmentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Enrollment Number</FormLabel>
                              <FormControl>
                                <Input placeholder="CS20220001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="name@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="contactNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="guardianNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Guardian's Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+0987654321" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                                  <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                                  <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                                  <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="course"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="B.Tech">B.Tech</SelectItem>
                                  <SelectItem value="M.Tech">M.Tech</SelectItem>
                                  <SelectItem value="PhD">PhD</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="branch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Branch" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                                  <SelectItem value="Electronics">Electronics</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="semester"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Semester</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Semester" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                    <SelectItem key={sem} value={sem.toString()}>
                                      {sem}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="section"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Section" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {['A', 'B', 'C', 'D'].map((sec) => (
                                    <SelectItem key={sec} value={sec}>
                                      {sec}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="mentor" className="mt-0">
                  <Form {...mentorForm}>
                    <form onSubmit={mentorForm.handleSubmit(onMentorSubmit)} className="space-y-4">
                      <FormField
                        control={mentorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. Jane Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mentorForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mentorForm.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Computer Science">Computer Science</SelectItem>
                                <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                                <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                                <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mentorForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={mentorForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </CardContent>
            </Tabs>
            
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-amiblue-600 hover:text-amiblue-700 font-medium underline-offset-4 hover:underline"
                >
                  Login here
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
