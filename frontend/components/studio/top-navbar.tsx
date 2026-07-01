"use client";

import * as React from "react";
import { Search, User, Moon, Code2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function StudioTopNavbar() {
  return (
    <header className="h-14 bg-[#09090b] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        {/* Project Name (Editable style) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors group">
          <Code2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm font-semibold text-foreground">fraud-detection-model</span>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-center max-w-md">
        {/* Command Palette / Search Style */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search datasets, models, or settings..." 
            className="w-full h-9 pl-9 pr-4 bg-[#18181b] border-white/10 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/20 rounded-md shadow-inner"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-[#09090b] text-[10px] font-mono text-muted-foreground">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-[#09090b] text-[10px] font-mono text-muted-foreground">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Theme Toggle Placeholder */}
        <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors">
          <Moon className="w-4 h-4" />
        </button>
        
        {/* Profile Avatar */}
        <button className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
