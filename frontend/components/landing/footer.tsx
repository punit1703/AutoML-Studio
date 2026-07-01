import * as React from "react";
import { cn } from "@/lib/utils";
import { Database } from "lucide-react";
import Link from "next/link";

export function Footer({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <footer className={cn("bg-background border-t py-12", className)}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 font-bold text-lg tracking-wide">
          <div className="bg-primary p-1.5 rounded-lg">
            <Database className="w-4 h-4 text-white" />
          </div>
          AutoML Studio
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
        </div>

        <div className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AutoML Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
