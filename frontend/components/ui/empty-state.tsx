import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center py-20 px-4 text-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col items-center max-w-md"
      >
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
          <Icon className="w-10 h-10 text-muted-foreground opacity-50" strokeWidth={1.5} />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {description}
        </p>

        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="bg-white/10 hover:bg-primary text-white hover:text-black border border-white/10 hover:border-primary transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          >
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
