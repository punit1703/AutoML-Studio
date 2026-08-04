"use client";

import { Construction } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
          $ workspace projects
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage all your machine learning projects.
        </p>
      </div>

      <div className="h-64 flex flex-col items-center justify-center border border-border rounded-xl bg-card shadow-sm text-center p-6">
        <Construction className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-xl font-bold font-mono mb-2">Under Construction</h2>
        <p className="text-muted-foreground">
          The comprehensive projects view is currently being built. 
          Use the Dashboard to switch between your active projects for now.
        </p>
      </div>
    </div>
  );
}
