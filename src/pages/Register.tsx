
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/lib/utils";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Invalid contact number"),
  guardianNumber: z.string().min(10, "Invalid guardian number"),
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
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  branches: z.string().array().nonempty("At least one branch is required"),
  courses: z.string().array().nonempty("At least one course is required"),
  semesters: z.string().array().nonempty("At least one semester is required"),
  sections: z.string().array().nonempty("At least one section is required"),
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
      branches: [],
      courses: [],
      semesters: [],
      sections: [],
      password: "",
      confirmPassword: "",
    },
  });

  const onStudentSubmit = async (data: z.infer<typeof studentSchema>) => {
    setIsLoading(true);
    try {
      // In a real app, we would register the user with Firebase Authentication
      // and store the user data in Firestore
      const user = {
        id: generateId(),
        ...data,
        role: "student",
      };
      
      // Mock successful registration
      setTimeout(() => {
        toast({
          title: "Registration successful",
          description: "You can now login with your credentials",
        });
        navigate("/login");
      }, 1000);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onMentorSubmit = async (data: z.infer<typeof mentorSchema>) => {
    setIsLoading(true);
    try {
      // In a real app, we would register the user with Firebase Authentication
      // and store the user data in Firestore
      const user = {
        id: generateId(),
        ...data,
        role: "mentor",
      };
      
      // Mock successful registration
      setTimeout(() => {
        toast({
          title: "Registration successful",
          description: "You can now login with your credentials",
        });
        navigate("/login");
      }, 1000);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for dropdowns
  const departments = ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"];
  const courses = ["B.Tech", "M.Tech", "MBA", "BBA"];
  const branches = ["Computer Science", "Information Technology", "Electrical", "Mechanical"];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const sections = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amiblue-400 to-amiblue-600 flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white font-semibold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-display font-bold mt-4">Create your AmiPass Account</h1>
            <p className="text-muted-foreground mt-2">
              Register to start managing your campus exit passes
            </p>
          </div>
          
          <Card className="animate-scale-up">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display">Register</CardTitle>
              <CardDescription>
                Choose your role to create your account
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
                              <FormLabel>Guardian's Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="+1234567890" {...field} />
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
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
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
                          name="course"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {courses.map((course) => (
                                    <SelectItem key={course} value={course}>
                                      {course}
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
                          name="branch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {branches.map((branch) => (
                                    <SelectItem key={branch} value={branch}>
                                      {branch}
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
                          name="semester"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Semester</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select semester" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {semesters.map((sem) => (
                                    <SelectItem key={sem} value={sem}>
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
                                    <SelectValue placeholder="Select section" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sections.map((sec) => (
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
                      
                      <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                        {isLoading ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="mentor" className="mt-0">
                  <Form {...mentorForm}>
                    <form onSubmit={mentorForm.handleSubmit(onMentorSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={mentorForm.control}
                          name="branches"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branches (Select multiple)</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  {branches.map((branch) => (
                                    <div key={branch} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`branch-${branch}`}
                                        className="h-4 w-4 rounded border-gray-300"
                                        value={branch}
                                        checked={field.value.includes(branch)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            field.onChange([...field.value, branch]);
                                          } else {
                                            field.onChange(
                                              field.value.filter((b) => b !== branch)
                                            );
                                          }
                                        }}
                                      />
                                      <label htmlFor={`branch-${branch}`} className="text-sm">
                                        {branch}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={mentorForm.control}
                          name="courses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Courses (Select multiple)</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  {courses.map((course) => (
                                    <div key={course} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`course-${course}`}
                                        className="h-4 w-4 rounded border-gray-300"
                                        value={course}
                                        checked={field.value.includes(course)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            field.onChange([...field.value, course]);
                                          } else {
                                            field.onChange(
                                              field.value.filter((c) => c !== course)
                                            );
                                          }
                                        }}
                                      />
                                      <label htmlFor={`course-${course}`} className="text-sm">
                                        {course}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={mentorForm.control}
                          name="semesters"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Semesters (Select multiple)</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-4 gap-2">
                                  {semesters.map((sem) => (
                                    <div key={sem} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`sem-${sem}`}
                                        className="h-4 w-4 rounded border-gray-300"
                                        value={sem}
                                        checked={field.value.includes(sem)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            field.onChange([...field.value, sem]);
                                          } else {
                                            field.onChange(
                                              field.value.filter((s) => s !== sem)
                                            );
                                          }
                                        }}
                                      />
                                      <label htmlFor={`sem-${sem}`} className="text-sm">
                                        {sem}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={mentorForm.control}
                          name="sections"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sections (Select multiple)</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-4 gap-2">
                                  {sections.map((sec) => (
                                    <div key={sec} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`sec-${sec}`}
                                        className="h-4 w-4 rounded border-gray-300"
                                        value={sec}
                                        checked={field.value.includes(sec)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          if (checked) {
                                            field.onChange([...field.value, sec]);
                                          } else {
                                            field.onChange(
                                              field.value.filter((s) => s !== sec)
                                            );
                                          }
                                        }}
                                      />
                                      <label htmlFor={`sec-${sec}`} className="text-sm">
                                        {sec}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </FormControl>
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
                      </div>
                      
                      <Button type="submit" className="w-full mt-6" disabled={isLoading}>
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
