"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Upload, 
  BarChart2, 
  Wand2, 
  PieChart, 
  Cpu, 
  CheckSquare, 
  Download,
  Database
} from "lucide-react";
import { motion } from "framer-motion";

const sidebarNavItems = [
  { title: "Dashboard", href: "/studio/dashboard", icon: LayoutDashboard },
  { title: "Upload", href: "/studio/upload", icon: Upload },
  { title: "Analysis", href: "/studio/analysis", icon: BarChart2 },
  { title: "Cleaning", href: "/studio/cleaning", icon: Wand2 },
  { title: "Visualization", href: "/studio/visualization", icon: PieChart },
  { title: "Training", href: "/studio/training", icon: Cpu },
  { title: "Evaluation", href: "/studio/evaluation", icon: CheckSquare },
  { title: "Downloads", href: "/studio/downloads", icon: Download },
];

export function StudioSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-[#09090b] border-r border-white/10 shrink-0">
      <div className="flex h-14 items-center px-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-wide text-foreground hover:opacity-80 transition-opacity">
          <div className="bg-primary/20 p-1.5 rounded border border-primary/30 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Database className="w-4 h-4 text-primary" />
          </div>
          AutoML Studio
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
        {sidebarNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.title}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-white/10 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
          <span>Cluster Online</span>
        </div>
        v2.0 Beta
      </div>
    </div>
  );
}
