
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { OutpassForm } from "@/components/OutpassForm";
import { Student } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StudentRequestProps {
  user: Student;
  onLogout: () => void;
}

export default function StudentRequest({ user, onLogout }: StudentRequestProps) {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    // Navigate back to dashboard after successful submission
    navigate("/student");
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userRole="student" userName={user.name} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display">Request New Outpass</h1>
          <p className="text-muted-foreground">
            Submit a new request for permission to leave campus
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription>
              Please provide accurate details for your outpass request. Your mentor will review this information 
              before approving or denying your request.
            </AlertDescription>
          </Alert>
          
          <OutpassForm student={user} onSuccess={handleSuccess} />
        </div>
      </main>
    </div>
  );
}
