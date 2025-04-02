
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isEditing: boolean;
  error?: string;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ isEditing, error, className, ...props }, ref) => {
    if (isEditing) {
      return (
        <Input
          ref={ref}
          className={cn(
            error && "border-red-500", 
            className
          )}
          {...props}
        />
      );
    }

    return (
      <div className={cn(
        "h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-sm",
        props.disabled && "opacity-50 cursor-not-allowed",
        className
      )}>
        {props.value || "Not specified"}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
