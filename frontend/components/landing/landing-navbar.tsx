"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export function LandingNavbar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md shadow-sm",
        className
      )}
    >
      <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-wide">
        <div className="bg-primary p-1.5 rounded-lg">
          <Database className="w-5 h-5 text-white" />
        </div>
        AutoML Studio
      </Link>
      
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
        <Link href="#workflow" className="hover:text-foreground transition-colors">Workflow</Link>
        <Link href="#algorithms" className="hover:text-foreground transition-colors">Algorithms</Link>
        <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
      </nav>

      <div className="flex items-center gap-4">
        <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
        <Button>Get Started</Button>
      </div>
    </motion.header>
  );
}
