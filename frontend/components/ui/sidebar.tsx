import * as React from "react";
import { cn } from "@/lib/utils";
import { Database, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar/20",
        className
      )}
    >
      <div className="flex h-16 items-center px-6 py-4 font-bold text-xl tracking-wide border-b border-sidebar/20">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          AutoML Studio
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        <NavItem href="#" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" active />
        <NavItem href="#" icon={<Database className="w-4 h-4" />} label="Datasets" />
        <NavItem href="#" icon={<Settings className="w-4 h-4" />} label="Settings" />
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
