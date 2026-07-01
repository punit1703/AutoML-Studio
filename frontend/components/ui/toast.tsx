import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { slideInRight } from "@/lib/animations";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export type ToastVariant = "default" | "success" | "error" | "warning";

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: string;
}

export function Toast({ title, description, variant = "default", onClose, className }: ToastProps) {
  const icons = {
    default: <Info className="w-5 h-5 text-primary" />,
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
  };

  return (
    <motion.div
      {...slideInRight}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-lg bg-card shadow-lg ring-1 ring-black/5",
        className
      )}
    >
      <div className="p-4 flex items-start gap-4 w-full">
        <div className="flex-shrink-0">{icons[variant]}</div>
        <div className="flex-1 pt-0.5">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {onClose && (
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md bg-card text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
