"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TestTubes, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function TrainingJobsPage() {
  const router = useRouter();
  const { setProjectId } = useAppContext();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("v1/jobs/")
      .then(res => setJobs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openJob = (job: any) => {
    if (job.project) {
      setProjectId(job.project);
      if (job.status === "COMPLETED") {
        router.push(`/studio/projects/${job.project}/results`);
      } else {
        router.push(`/studio/projects/${job.project}/progress`);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Training Jobs</h1>
          <p className="text-muted-foreground">Monitor the status of your machine learning workloads.</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-dashed border-border flex flex-col items-center">
              <TestTubes className="w-12 h-12 mb-4 opacity-20" />
              <p>No training jobs found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map(job => (
                <div key={job.id} onClick={() => openJob(job)} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <TestTubes className="w-4 h-4 text-muted-foreground group-hover:text-primary" /> 
                      {job.job_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="bg-secondary px-2 py-1 rounded">Stage: {job.current_stage || "Initializing"}</span>
                      {job.progress && <span className="bg-secondary px-2 py-1 rounded">Progress: {job.progress}%</span>}
                      {job.metrics?.duration && <span className="bg-secondary px-2 py-1 rounded">Time: {job.metrics.duration}s</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-xs px-3 py-1 font-bold rounded-full ${job.status === 'COMPLETED' ? 'bg-success/20 text-success' : job.status === 'FAILED' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                      {job.status}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
