import * as React from "react";
import Link from "next/link";
import { Database } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Dark Mode Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Deep Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Logo Header */}
      <div className="relative z-10 mb-8">
        <Link href="/" className="flex items-center justify-center gap-2 font-bold text-xl tracking-wide text-foreground hover:opacity-80 transition-opacity">
          <div className="bg-primary/20 p-2 rounded-lg border border-primary/30 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <Database className="w-5 h-5 text-primary" />
          </div>
          AutoML Studio
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
