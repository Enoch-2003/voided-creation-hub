
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mentor } from "@/lib/types";
import storageSync from "@/lib/storageSync";

const departments = ["Computer Science", "Electronics", "Civil Engineering", "Mechanical Engineering", "Business Administration"];

interface MentorProfileEditProps {
  mentor: Mentor;
  onClose: () => void;
  onUpdate: () => void;
}

export default function MentorProfileEdit({ mentor, onClose, onUpdate }: MentorProfileEditProps) {
  const [name, setName] = useState(mentor.name || "");
  const [email, setEmail] = useState(mentor.email || "");
  const [department, setDepartment] = useState(mentor.department || "");
  const [contactNumber, setContactNumber] = useState(mentor.contactNumber || "");
  const { toast } = useToast();

  useEffect(() => {
    // Update form when mentor prop changes
    setName(mentor.name || "");
    setEmail(mentor.email || "");
    setDepartment(mentor.department || "");
    setContactNumber(mentor.contactNumber || "");
  }, [mentor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !department || !contactNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get all users
      const usersJson = localStorage.getItem("users");
      if (!usersJson) {
        throw new Error("No users found");
      }
      
      const users = JSON.parse(usersJson);
      
      // Find and update the mentor
      const updatedUsers = users.map((user: any) => {
        if (user.id === mentor.id) {
          return {
            ...user,
            name,
            email,
            department,
            contactNumber,
          };
        }
        return user;
      });
      
      // Save back to localStorage
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      
      // Update both local and session storage for the current user
      const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      const updatedUser = {
        ...currentUser,
        name,
        email,
        department,
        contactNumber,
      };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Update sync storage
      storageSync.setUser(updatedUser, "mentor");
      
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
      
      // Call onUpdate to refresh parent component
      onUpdate();
      
      // Close the form
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your mentor profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Your contact number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select onValueChange={setDepartment} value={department}>
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
          
          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
