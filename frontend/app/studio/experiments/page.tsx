"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TestTubes, Loader2, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ExperimentsPage() {
  const router = useRouter();
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("v1/jobs/")
      .then(res => setExperiments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Experiments</h1>
          <p className="text-muted-foreground">Track all your ML job runs, profiling tasks, and model evaluations.</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : experiments.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-dashed border-border flex flex-col items-center">
              <TestTubes className="w-12 h-12 mb-4 opacity-20" />
              <p>No experiments found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {experiments.map(exp => (
                <div key={exp.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {exp.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : exp.status === 'FAILED' ? (
                        <XCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      )}
                      <h3 className="font-bold text-lg text-foreground font-mono">
                        {exp.job_type.replace('_', ' ').toUpperCase()}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        exp.status === 'COMPLETED' ? 'bg-success/20 text-success' : 
                        exp.status === 'FAILED' ? 'bg-destructive/20 text-destructive' : 
                        'bg-primary/20 text-primary'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">Stage: {exp.current_stage || 'Unknown'}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-1 rounded">Started: {new Date(exp.created_at).toLocaleString()}</span>
                      {exp.progress !== undefined && (
                        <span className="bg-secondary px-2 py-1 rounded border border-border">Progress: {exp.progress}%</span>
                      )}
                    </div>

                    {exp.result?.best_model && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border max-w-2xl">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Winning Model</div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-primary">{exp.result.best_model.name}</span>
                          <div className="flex gap-4">
                            {Object.entries(exp.result.best_model.metrics).filter(([k]) => k !== 'cv_scores').slice(0, 3).map(([k, v]: any) => (
                              <div key={k} className="text-xs">
                                <span className="text-muted-foreground">{k.replace('_', ' ')}:</span> <span className="font-mono font-bold">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {exp.error_message && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono rounded">
                        {exp.error_message}
                      </div>
                    )}
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
