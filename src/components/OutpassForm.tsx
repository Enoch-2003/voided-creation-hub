
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Student } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const outpassSchema = z.object({
  exitDateTime: z
    .string()
    .min(1, "Exit date and time is required")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, "Exit date and time must be in the future"),
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(200, "Reason cannot exceed 200 characters"),
});

interface OutpassFormProps {
  student: Student;
  onSuccess?: () => void;
}

export function OutpassForm({ student, onSuccess }: OutpassFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<z.infer<typeof outpassSchema>>({
    resolver: zodResolver(outpassSchema),
    defaultValues: {
      exitDateTime: "",
      reason: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof outpassSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Create a new outpass request
      const newOutpass = {
        id: generateId(),
        studentId: student.id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        exitDateTime: new Date(data.exitDateTime).toISOString(),
        reason: data.reason,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Get existing outpasses from localStorage or initialize
      const outpasses = JSON.parse(localStorage.getItem("outpasses") || "[]");
      
      // Add new outpass
      outpasses.push(newOutpass);
      
      // Save back to localStorage
      localStorage.setItem("outpasses", JSON.stringify(outpasses));
      
      toast({
        title: "Outpass requested successfully",
        description: "Your request has been sent to your mentor for approval.",
      });
      
      // Reset form
      form.reset();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Could not submit outpass request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Request New Outpass</CardTitle>
        <CardDescription>
          Fill out this form to request permission to leave campus
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="exitDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exit Date & Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field} 
                      min={new Date().toISOString().slice(0, 16)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Exit</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide a detailed reason for your exit request..." 
                      {...field} 
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
