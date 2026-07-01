import * as React from "react";
import { cn } from "@/lib/utils";
import { Bell, User } from "lucide-react";
import { Button } from "./button";

export function Navbar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Placeholder for left-side items if any, like mobile menu toggle */}
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
