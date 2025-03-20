
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Admin, Student } from "@/lib/types";
import { Search, User, Save, AlertCircle } from "lucide-react";
import storageSync from "@/lib/storageSync";
import { toast } from "sonner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOutpasses } from "@/hooks/useOutpasses";

interface AdminStudentEditProps {
  user: Admin;
  onLogout: () => void;
}

// Form schema for validation
const studentProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  contactNumber: z.string().min(10, { message: "Contact number must be at least 10 digits" }),
  guardianNumber: z.string().min(10, { message: "Guardian number must be at least 10 digits" }),
  department: z.string().min(1, { message: "Department is required" }),
  course: z.string().min(1, { message: "Course is required" }),
  branch: z.string().min(1, { message: "Branch is required" }),
  semester: z.string().min(1, { message: "Semester is required" }),
  section: z.string().min(1, { message: "Section is required" }),
});

export default function AdminStudentEdit({ user, onLogout }: AdminStudentEditProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const { updateUser } = useOutpasses();

  // Load all students
  useEffect(() => {
    // Get all users from storage
    const users = storageSync.getItem<any[]>('users') || [];
    // Filter to only include students
    const students = users.filter(user => user.role === 'student') as Student[];
    setAllStudents(students);
    
    // Subscribe to users changes to keep the list updated
    const unsubscribe = storageSync.subscribe('users', (updatedUsers) => {
      if (Array.isArray(updatedUsers)) {
        const students = updatedUsers.filter(user => user.role === 'student') as Student[];
        setAllStudents(students);
        
        // Update selected student if it's in the list
        if (selectedStudent) {
          const updatedStudent = students.find(s => s.id === selectedStudent.id);
          if (updatedStudent) {
            setSelectedStudent(updatedStudent);
            
            // Update form if editing
            if (isEditing) {
              form.reset({
                name: updatedStudent.name,
                email: updatedStudent.email,
                contactNumber: updatedStudent.contactNumber,
                guardianNumber: updatedStudent.guardianNumber,
                department: updatedStudent.department,
                course: updatedStudent.course,
                branch: updatedStudent.branch,
                semester: updatedStudent.semester.toString(), // Convert to string
                section: updatedStudent.section,
              });
            }
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, [selectedStudent, isEditing]);

  // Set up form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof studentProfileSchema>>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
      guardianNumber: "",
      department: "",
      course: "",
      branch: "",
      semester: "",
      section: "",
    },
    mode: "onChange" // Enable onChange validation mode
  });

  // Search for students by enrollment number
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("Please enter an enrollment number to search");
      return;
    }

    setIsSearching(true);
    
    // Find student by enrollment number
    const foundStudent = allStudents.find(
      student => student.enrollmentNumber.toLowerCase() === searchTerm.toLowerCase()
    );

    if (foundStudent) {
      setSelectedStudent(foundStudent);
      // Reset form with found student's data
      form.reset({
        name: foundStudent.name,
        email: foundStudent.email,
        contactNumber: foundStudent.contactNumber,
        guardianNumber: foundStudent.guardianNumber,
        department: foundStudent.department,
        course: foundStudent.course,
        branch: foundStudent.branch,
        semester: foundStudent.semester.toString(), // Convert to string
        section: foundStudent.section,
      });
    } else {
      toast.error("No student found with that enrollment number");
      setSelectedStudent(null);
    }
    
    setIsSearching(false);
  };

  // Handle form submission for updating student profile
  const onSubmit = (data: z.infer<typeof studentProfileSchema>) => {
    if (!selectedStudent) return;
    
    setUpdateInProgress(true);

    // Update student data
    const updatedStudent: Student = {
      ...selectedStudent,
      name: data.name,
      email: data.email,
      contactNumber: data.contactNumber,
      guardianNumber: data.guardianNumber,
      department: data.department,
      course: data.course,
      branch: data.branch,
      semester: data.semester,
      section: data.section
    };

    try {
      // Use the updateUser function from useOutpasses to ensure proper cross-tab communication
      updateUser(updatedStudent);
      
      // Also update outpasses with this student's information
      const outpasses = storageSync.getItem<any[]>('outpasses') || [];
      const updatedOutpasses = outpasses.map(outpass => {
        if (outpass.studentId === updatedStudent.id) {
          return {
            ...outpass,
            studentName: updatedStudent.name,
            studentSection: updatedStudent.section
          };
        }
        return outpass;
      });
      
      // Save updated outpasses
      storageSync.setItem('outpasses', updatedOutpasses);
      
      // Broadcast explicitly to ensure real-time updates
      if (typeof BroadcastChannel !== 'undefined') {
        // Send specific update for this user
        const userChannel = new BroadcastChannel('amipass_user_changed');
        userChannel.postMessage({ userId: updatedStudent.id, forceUpdate: true });
        userChannel.close();
        
        // Also send general update for outpasses
        const outpassChannel = new BroadcastChannel('amity-outpass-outpasses');
        outpassChannel.postMessage({ type: 'update', key: 'outpasses' });
        outpassChannel.close();
      }
      
      setSelectedStudent(updatedStudent);
      
      // Show success message
      toast.success("Student profile updated successfully", {
        description: "All dashboard instances with this student's data will be updated in real-time."
      });
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error("Failed to update student profile");
    } finally {
      setUpdateInProgress(false);
      setIsEditing(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Edit Student Profile</h1>
            <p className="text-muted-foreground mt-1">
              Search and edit student information
            </p>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Find Student</CardTitle>
            <CardDescription>
              Enter student enrollment number to search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter enrollment number..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Details and Edit Form */}
        {selectedStudent && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedStudent.name}
                  </CardTitle>
                  <CardDescription>
                    Enrollment: {selectedStudent.enrollmentNumber}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                  disabled={updateInProgress}
                >
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="guardianNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guardian Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ASET">ASET</SelectItem>
                                <SelectItem value="ABS">ABS</SelectItem>
                                <SelectItem value="ASCO">ASCO</SelectItem>
                                <SelectItem value="ALS">ALS</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="course"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="branch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="semester"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semester</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    Semester {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Real-time updates</AlertTitle>
                      <AlertDescription>
                        Changes will be reflected immediately in student dashboards across all active tabs
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={updateInProgress}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateInProgress}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateInProgress ? "Saving Changes..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                    <p>{selectedStudent.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email Address</h3>
                    <p>{selectedStudent.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Enrollment Number</h3>
                    <p>{selectedStudent.enrollmentNumber}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Department</h3>
                    <p>{selectedStudent.department}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Course</h3>
                    <p>{selectedStudent.course}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Branch</h3>
                    <p>{selectedStudent.branch}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Semester</h3>
                    <p>{selectedStudent.semester}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Section</h3>
                    <p>{selectedStudent.section}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact Number</h3>
                    <p>{selectedStudent.contactNumber}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Guardian Number</h3>
                    <p>{selectedStudent.guardianNumber}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
