"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { scaleUp } from "@/lib/animations";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, description, children, footer }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Dialog Container */}
          <motion.div
            {...scaleUp}
            className="relative z-50 w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg sm:rounded-2xl"
          >
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
              <h2 className="text-xl font-semibold leading-none tracking-tight">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            
            <div className="mb-6">{children}</div>
            
            {footer && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
