
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isEditing?: boolean;
  className?: string;
  error?: string;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ isEditing = true, className, error, ...props }, ref) => {
    return (
      <div className="space-y-1 w-full">
        <Input
          ref={ref}
          className={cn(
            "w-full transition-all",
            !isEditing && "bg-gray-50 border-transparent focus:border-transparent focus:ring-0",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          readOnly={!isEditing}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
