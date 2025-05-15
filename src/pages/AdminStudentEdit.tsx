
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Layout } from '@/components/Layout';
import { Admin, Student, dbToStudentFormat } from '@/lib/types';
import { ChevronLeft, Save, X, Edit, AlertCircle, Check, Search, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOutpasses } from '@/hooks/useOutpasses';
import EnhancedInput from '@/components/EnhancedInput';
import { 
  ensureString, 
  sanitizeFormData, 
  hasFormChanges
} from '@/lib/formUtils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';

// Form schema for student edit
const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  contactNumber: z.string().min(10, "Contact number should be at least 10 digits"),
  guardianEmail: z.string().email("Please enter a valid guardian email"),
  department: z.string().min(1, "Department is required"),
  course: z.string().min(1, "Course is required"),
  branch: z.string().min(1, "Branch is required"),
  semester: z.string().min(1, "Semester is required"),
  section: z.string().min(1, "Section is required"),
});

// Type for the form data
type StudentFormValues = z.infer<typeof studentFormSchema>;

type Props = {
  user: Admin;
  onLogout: () => void;
};

export default function AdminStudentEdit({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { updateUser } = useOutpasses();
  
  // State variables
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateInProgress, setUpdateInProgress] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [originalStudentData, setOriginalStudentData] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'dropdown' | 'table'>('dropdown');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const studentsPerPage = 5;
  
  // Initialize form
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      contactNumber: "",
      guardianEmail: "",
      department: "",
      course: "",
      branch: "",
      semester: "",
      section: "",
    },
    mode: "onChange",
  });

  // Load student data from Supabase
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('students')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        if (data) {
          // Convert DB format to frontend format
          const formattedStudents = data.map(dbToStudentFormat);
          setStudents(formattedStudents);
          setFilteredStudents(formattedStudents);
          
          // Check if there's a student ID in the URL
          const searchParams = new URLSearchParams(location.search);
          const studentId = searchParams.get('id');
          
          if (studentId) {
            const student = formattedStudents.find((s) => s.id === studentId);
            if (student) {
              handleStudentSelect(student);
            }
          }
        }
      } catch (error) {
        console.error("Error loading student data:", error);
        toast({
          title: "Error",
          description: "Failed to load student data. Please try again.",
          variant: "destructive",
        });
        
        // Try to load from localStorage as fallback
        const storedUsers = localStorage.getItem("users");
        if (storedUsers) {
          try {
            const allUsers = JSON.parse(storedUsers);
            const studentUsers = allUsers.filter((u: any) => u.role === 'student');
            setStudents(studentUsers);
            setFilteredStudents(studentUsers);
          } catch (e) {
            console.error("Error parsing stored users:", e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, [location.search, toast]);

  // Handle search by enrollment number or name
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const lowercaseSearch = searchTerm.toLowerCase();
        return (
          (student.enrollmentNumber?.toLowerCase() || '').includes(lowercaseSearch) ||
          (student.name?.toLowerCase() || '').includes(lowercaseSearch) ||
          (student.section?.toLowerCase() || '').includes(lowercaseSearch)
        );
      });
      setFilteredStudents(filtered);
      // Reset to first page when searching
      setCurrentPage(1);
    }
  }, [searchTerm, students]);

  // Get current students for pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle student selection
  const handleStudentSelect = (student: Student | null) => {
    if (!student) {
      setSelectedStudentId("");
      setSelectedStudent(null);
      setOriginalStudentData(null);
      form.reset({
        name: "",
        email: "",
        contactNumber: "",
        guardianEmail: "",
        department: "",
        course: "",
        branch: "",
        semester: "",
        section: "",
      });
      setIsEditing(false);
      return;
    }
    
    setSelectedStudentId(student.id);
    setSelectedStudent(student);
    setOriginalStudentData({...student});
    
    // Populate form with student data
    const sanitizedData = sanitizeFormData({
      name: student.name || "",
      email: student.email || "",
      contactNumber: student.contactNumber || "",
      guardianEmail: student.guardianEmail || "",
      department: student.department || "",
      course: student.course || "",
      branch: student.branch || "",
      semester: ensureString(student.semester),
      section: student.section || "",
    });
    
    form.reset(sanitizedData);
    
    // Update URL with student ID
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('id', student.id);
    navigate({
      pathname: location.pathname,
      search: searchParams.toString(),
    }, { replace: true });
    
    setIsEditing(false);
    setUpdateSuccess(false);
    setUpdateError("");
  };

  // Handle dropdown selection
  const handleStudentChange = (studentId: string) => {
    if (!studentId) {
      handleStudentSelect(null);
      return;
    }
    
    const student = students.find(s => s.id === studentId);
    if (student) {
      handleStudentSelect(student);
    }
  };

  // Handle form submission
  const onSubmit = async (data: StudentFormValues) => {
    if (!selectedStudent || !originalStudentData) return;
    
    // Check if there are any changes
    const hasChanges = hasFormChanges(originalStudentData, data);
    if (!hasChanges) {
      toast({
        title: "No changes detected",
        description: "No changes were made to the student profile.",
      });
      setIsEditing(false);
      return;
    }
    
    setUpdateInProgress(true);
    setUpdateError("");
    setUpdateSuccess(false);
    
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('students')
        .update({
          name: data.name,
          email: data.email,
          contact_number: data.contactNumber,
          guardian_email: data.guardianEmail,
          department: data.department,
          course: data.course,
          branch: data.branch,
          semester: data.semester,
          section: data.section
        })
        .eq('id', selectedStudent.id);
      
      if (error) throw error;
      
      // Prepare updated student data
      const updatedStudentData: Student = {
        ...selectedStudent,
        name: data.name,
        email: data.email,
        contactNumber: data.contactNumber,
        guardianEmail: data.guardianEmail,
        department: data.department,
        course: data.course,
        branch: data.branch,
        semester: data.semester,
        section: data.section
      };
      
      // Update selected student state
      setSelectedStudent(updatedStudentData);
      setOriginalStudentData({...updatedStudentData});
      
      // Update student in the students list
      const updatedStudents = students.map(s => 
        s.id === updatedStudentData.id ? updatedStudentData : s
      );
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents.filter(student => {
        if (searchTerm.trim() === "") return true;
        
        const lowercaseSearch = searchTerm.toLowerCase();
        return (
          (student.enrollmentNumber?.toLowerCase() || '').includes(lowercaseSearch) ||
          (student.name?.toLowerCase() || '').includes(lowercaseSearch) ||
          (student.section?.toLowerCase() || '').includes(lowercaseSearch)
        );
      }));
      
      // Show success message
      setUpdateSuccess(true);
      toast({
        title: "Success",
        description: "Student profile updated successfully",
      });
      
      // Exit editing mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating student:", error);
      setUpdateError("Failed to update student profile. Please try again.");
      toast({
        title: "Error",
        description: "Failed to update student profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdateInProgress(false);
    }
  };

  // Toggle view mode between dropdown and table
  const toggleViewMode = () => {
    setViewMode(viewMode === 'dropdown' ? 'table' : 'dropdown');
  };

  return (
    <Layout user={user} onLogout={onLogout} activeTab="Edit Student Profile">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => navigate("/admin")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Student Profile Management</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Find Students</CardTitle>
                <CardDescription>
                  Search for students by enrollment number, name, or section
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleViewMode}
              >
                {viewMode === 'dropdown' ? 'Table View' : 'Dropdown View'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by enrollment number, name, or section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : viewMode === 'dropdown' ? (
                <Select
                  value={selectedStudentId}
                  onValueChange={handleStudentChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-gray-500">No students found</div>
                    ) : (
                      filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} - {student.enrollmentNumber} ({student.section || 'No section'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            No students found
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentStudents.map((student) => (
                          <TableRow 
                            key={student.id}
                            className={selectedStudentId === student.id ? "bg-blue-50" : ""}
                          >
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.enrollmentNumber}</TableCell>
                            <TableCell>{student.section || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStudentSelect(student)}
                              >
                                <User className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for table view */}
                  {filteredStudents.length > studentsPerPage && (
                    <div className="p-2 border-t">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => paginate(Math.max(1, currentPage - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                            let pageNumber;
                            
                            // Calculate page numbers to show based on current page
                            if (totalPages <= 5) {
                              pageNumber = index + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = index + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + index;
                            } else {
                              pageNumber = currentPage - 2 + index;
                            }
                            
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink 
                                  isActive={currentPage === pageNumber}
                                  onClick={() => paginate(pageNumber)}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {selectedStudent ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedStudent.name}</CardTitle>
                <CardDescription>
                  Enrollment: {selectedStudent.enrollmentNumber} | Section: {selectedStudent.section || 'Not assigned'}
                </CardDescription>
              </div>
              <Button 
                onClick={() => {
                  if (isEditing) {
                    // Cancel editing - reset form to original student data
                    if (originalStudentData) {
                      const sanitizedData = sanitizeFormData({
                        name: originalStudentData.name || "",
                        email: originalStudentData.email || "",
                        contactNumber: originalStudentData.contactNumber || "",
                        guardianEmail: originalStudentData.guardianEmail || "",
                        department: originalStudentData.department || "",
                        course: originalStudentData.course || "",
                        branch: originalStudentData.branch || "",
                        semester: ensureString(originalStudentData.semester),
                        section: originalStudentData.section || "",
                      });
                      form.reset(sanitizedData);
                    }
                  }
                  setIsEditing(!isEditing);
                }}
                variant={isEditing ? "outline" : "default"}
                disabled={updateInProgress}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel Editing
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </CardHeader>
            
            <CardContent>
              {updateSuccess && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <Check className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-800">Profile Updated</AlertTitle>
                  <AlertDescription className="text-green-700">
                    The student profile has been updated successfully.
                  </AlertDescription>
                </Alert>
              )}
              
              {updateError && (
                <Alert className="mb-6" variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter full name" 
                                error={form.formState.errors.name?.message}
                                {...field} 
                              />
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
                              <EnhancedInput 
                                isEditing={isEditing} 
                                type="email" 
                                placeholder="Enter email address" 
                                error={form.formState.errors.email?.message}
                                {...field} 
                              />
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
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter contact number" 
                                error={form.formState.errors.contactNumber?.message}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="guardianEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guardian's Email</FormLabel>
                            <FormControl>
                              <EnhancedInput 
                                isEditing={isEditing} 
                                type="email"
                                placeholder="Enter guardian's email" 
                                error={form.formState.errors.guardianEmail?.message}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <FormControl>
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter department" 
                                error={form.formState.errors.department?.message}
                                {...field} 
                              />
                            </FormControl>
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
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter course" 
                                error={form.formState.errors.course?.message}
                                {...field} 
                              />
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
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter branch" 
                                error={form.formState.errors.branch?.message}
                                {...field} 
                              />
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
                            <FormControl>
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter semester" 
                                error={form.formState.errors.semester?.message}
                                {...field} 
                              />
                            </FormControl>
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
                              <EnhancedInput 
                                isEditing={isEditing} 
                                placeholder="Enter section" 
                                error={form.formState.errors.section?.message}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {isEditing && (
                    <CardFooter className="px-0 pb-0 pt-4 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={updateInProgress}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateInProgress || !form.formState.isValid}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {updateInProgress ? "Saving Changes..." : "Save Changes"}
                      </Button>
                    </CardFooter>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gray-50">
            <CardContent className="pt-6 text-center text-gray-500">
              <div className="py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Student Selected</h3>
                <p>Please select a student from the search results to view or edit their profile</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
