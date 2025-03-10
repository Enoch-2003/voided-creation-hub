
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { mockAuthenticate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Student, Mentor } from "@/lib/types";

const studentSchema = z.object({
  enrollmentNumber: z.string().min(1, "Enrollment number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const mentorSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [activeTab, setActiveTab] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const studentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      enrollmentNumber: "",
      password: "",
    },
  });

  const mentorForm = useForm<z.infer<typeof mentorSchema>>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onStudentSubmit = async (data: z.infer<typeof studentSchema>) => {
    setIsLoading(true);
    try {
      const user = await mockAuthenticate(
        data.enrollmentNumber,
        data.password,
        "student"
      );
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", "student");
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      
      navigate("/student");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onMentorSubmit = async (data: z.infer<typeof mentorSchema>) => {
    setIsLoading(true);
    try {
      const user = await mockAuthenticate(
        data.email,
        data.password,
        "mentor"
      );
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", "mentor");
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
      
      navigate("/mentor");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid credentials. Please try again.",
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
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amiblue-400 to-amiblue-600 flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white font-semibold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-display font-bold mt-4">Welcome to AmiPass</h1>
            <p className="text-muted-foreground mt-2">
              Login to manage your outpass requests
            </p>
          </div>
          
          <Card className="animate-scale-up">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display">Login</CardTitle>
              <CardDescription>
                Choose your role to sign in to your account
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
                      
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="mentor" className="mt-0">
                  <Form {...mentorForm}>
                    <form onSubmit={mentorForm.handleSubmit(onMentorSubmit)} className="space-y-4">
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
                      
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </CardContent>
            </Tabs>
            
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm text-muted-foreground mt-2">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-amiblue-600 hover:text-amiblue-700 font-medium underline-offset-4 hover:underline"
                >
                  Register here
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
