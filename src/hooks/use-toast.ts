
import { toast as sonnerToast } from "sonner";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"; // Ensure this imports types, not conflicting hooks
import type React from "react";

interface Toast extends ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
}

const toast = ({ ...props }: Toast) => {
  if (props.variant === "destructive") {
    return sonnerToast.error(props.title || "Error", {
      description: props.description,
      action: props.action,
      id: props.id, // Pass id to sonner
    });
  }
  return sonnerToast(props.title || "Notification", {
    description: props.description,
    action: props.action,
    id: props.id, // Pass id to sonner
  });
};

// This useToast hook is a compatibility layer.
// Sonner itself doesn't require a `useToast` hook in the same way shadcn's original implementation did,
// as `sonnerToast` can be called directly.
// The `toasts` array here is a mock and won't reflect sonner's internal state.
// Components relying on `toasts` from `useToast` would need to be refactored if they expect a list of active toasts.
const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [], // This is a placeholder. Sonner manages its own state.
  };
};

export { useToast, toast };
