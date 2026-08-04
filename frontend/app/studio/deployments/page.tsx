"use client";

import { Construction } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeploymentsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
          $ deployment registry
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Monitor your deployed models and endpoints.
        </p>
      </div>

      <div className="h-64 flex flex-col items-center justify-center border border-border rounded-xl bg-card shadow-sm text-center p-6">
        <Construction className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-xl font-bold font-mono mb-2">Detailed view coming soon</h2>
        <p className="text-muted-foreground mb-6">
          The API endpoints monitoring dashboard is being built. 
          For now, please view your deployed models via the Prediction Apps view.
        </p>
        <Button onClick={() => router.push("/studio/apps")}>
          Go to Prediction Apps
        </Button>
      </div>
    </div>
  );
}
