"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { slideIn } from "@/lib/animations";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  animated?: boolean;
}

export function SectionHeading({
  title,
  description,
  className,
  animated = true,
  ...props
}: SectionHeadingProps) {
  const content = (
    <>
      <h2 className="text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground">{description}</p>
      )}
    </>
  );

  if (animated) {
    return (
      <motion.div
        className={cn("mb-8 space-y-2", className)}
        {...slideIn}
        {...(props as any)}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={cn("mb-8 space-y-2", className)} {...props}>
      {content}
    </div>
  );
}
