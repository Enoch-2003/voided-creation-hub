
import React from 'react';
import { Clock, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface VerificationStatusProps {
  isLoading: boolean;
  error: string | null;
  navigateBack: () => void;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  isLoading,
  error,
  navigateBack
}) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-16 w-16 mx-auto text-blue-500 animate-pulse mb-4" />
          <h2 className="text-xl font-medium text-gray-900">Verifying outpass...</h2>
          <p className="mt-2 text-gray-500">Please wait while we check your outpass</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto text-center p-6">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-medium text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={navigateBack}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return null;
};
