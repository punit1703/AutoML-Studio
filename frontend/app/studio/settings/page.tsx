"use client";

import { Construction } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
          $ system preferences
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure your workspace and AI pipeline settings.
        </p>
      </div>

      <div className="h-64 flex flex-col items-center justify-center border border-border rounded-xl bg-card shadow-sm text-center p-6">
        <Construction className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-xl font-bold font-mono mb-2">Settings Hub Coming Soon</h2>
        <p className="text-muted-foreground">
          We are finalizing the advanced configuration options for the AutoML engine.
        </p>
      </div>
    </div>
  );
}
