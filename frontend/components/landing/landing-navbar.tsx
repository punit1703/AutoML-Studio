"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export function LandingNavbar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "pointer-events-auto flex h-14 items-center justify-between rounded-full bg-background/60 px-6 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 w-full max-w-5xl",
          className
        )}
      >
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wide">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <Database className="w-4 h-4 text-primary" />
          </div>
          AutoML Studio
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#workflow" className="hover:text-foreground transition-colors">Workflow</Link>
          <Link href="#algorithms" className="hover:text-foreground transition-colors">Algorithms</Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-sm font-medium h-9 px-4">Log in</Button>
          <Button className="rounded-full h-9 px-5 text-sm font-medium shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all">Get Started</Button>
        </div>
      </motion.header>
    </div>
  );
}
