"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Loader2, CheckCircle2, XCircle, ArrowRight, Clock, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function TrainingProgressPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Mocking: finding the latest job for this project
        // In reality, this might be a specific endpoint or derived from /v1/jobs/
        const res = await api.get(`v1/jobs/`);
        const projectJobs = res.data.filter((j: any) => j.project === projectId);
        if (projectJobs.length > 0) {
          const latestJob = projectJobs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          setJob(latestJob);
          
          if (latestJob.status === "COMPLETED" || latestJob.status === "FAILED") {
            if (timerRef.current) clearInterval(timerRef.current);
          }
        }
      } catch (error) {
        console.error("Failed to fetch job", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
    const interval = setInterval(fetchJob, 3000); // Poll every 3 seconds
    
    // Elapsed time counter
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [projectId]);

  if (loading && !job) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Initializing Training Cluster...</h2>
        <p className="text-muted-foreground">Provisioning resources for your ML workload.</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-warning" />
        <h2 className="text-xl font-bold font-mono">No Active Job Found</h2>
        <p className="text-muted-foreground">We couldn't find an active training job for this project.</p>
        <button onClick={() => router.push(`/studio/projects/${projectId}/training`)} className="px-4 py-2 bg-primary text-background rounded font-semibold mt-4">
          Go Back
        </button>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const isCompleted = job.status === "COMPLETED";
  const isFailed = job.status === "FAILED";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
          {isCompleted ? (
            <CheckCircle2 className="w-8 h-8 text-success" />
          ) : isFailed ? (
            <XCircle className="w-8 h-8 text-destructive" />
          ) : (
            <Activity className="w-8 h-8 text-primary animate-pulse" />
          )}
        </div>
        <h1 className="text-3xl font-bold font-mono">
          {isCompleted ? "Training Complete" : isFailed ? "Training Failed" : "Training in Progress"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isCompleted ? "Your models are ready for evaluation." : isFailed ? "An error occurred during training." : "Optimizing hyperparameters and fitting models."}
        </p>
      </div>

      <Card className="bg-card border-border shadow-lg">
        <CardContent className="p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Current Stage</div>
              <div className="text-xl font-bold capitalize">{job.current_stage || job.status}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Elapsed Time</div>
              <div className="text-xl font-mono font-bold flex items-center justify-end gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                {job.metrics?.duration ? formatTime(job.metrics.duration) : formatTime(elapsedTime)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <span>Overall Progress</span>
              <span>{job.progress || 0}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${isCompleted ? "bg-success" : isFailed ? "bg-destructive" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${job.progress || 0}%` }}
                transition={{ ease: "linear", duration: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-mono font-bold text-success mb-1">{job.metrics?.completed_models || 0}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Models Trained</span>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-mono font-bold mb-1 ${job.metrics?.failed_models > 0 ? "text-destructive" : "text-foreground"}`}>
                {job.metrics?.failed_models || 0}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Failed Models</span>
            </div>
          </div>
          
          {job.metrics?.current_model && !isCompleted && !isFailed && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-primary uppercase font-bold block mb-1">Currently Training</span>
                <span className="font-mono text-sm">{job.metrics.current_model}</span>
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>

      {isCompleted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
          <button
            onClick={() => router.push(`/studio/projects/${projectId}/results`)}
            className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2 text-lg"
          >
            View Results <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
