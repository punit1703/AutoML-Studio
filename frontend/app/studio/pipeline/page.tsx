"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import api, { downloadFile } from "@/lib/api";
import { 
  CheckCircle2, Loader2, Rocket, Star, Link as LinkIcon, Globe, AlertTriangle
} from "lucide-react";

export default function PipelineBuilderPage() {
  const router = useRouter();
  const { datasetId, projectId } = useAppContext();
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Pipeline Visual States
  const pipelineStages = [
    "Queued for training",
    "Extracting dataset metadata",
    "Preprocessing data",
    "Training models",
    "Hyperparameter optimization",
    "Evaluating performance",
    "Pipeline generated successfully"
  ];
  
  const [currentStage, setCurrentStage] = useState<string>("Queued for training");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!datasetId) {
      router.push("/studio/dashboard");
      return;
    }

    const savedTarget = localStorage.getItem(`target_column_${datasetId}`);
    if (!savedTarget) {
      router.push(`/studio/projects/${projectId}/target`);
      return;
    }
    setTargetColumn(savedTarget);

    // Start Pipeline automatically on mount
    const startPipeline = async () => {
      try {
        const savedBudget = localStorage.getItem(`training_budget_${datasetId}`) || "standard";
        const res = await api.post(`v1/datasets/${datasetId}/run_pipeline/`, { 
          target_column: savedTarget,
          budget: savedBudget
        });
        const jobId = res.data.job_id;
        setActiveJobId(jobId);
        pollJob(jobId);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e.response?.data?.error || "Failed to start pipeline.");
      }
    };

    startPipeline();
  }, [datasetId, projectId, router]);

  const pollJob = async (jobId: string) => {
    try {
      const jobRes = await api.get(`v1/jobs/${jobId}/`);
      const job = jobRes.data;
      
      setCurrentStage(job.current_stage || "Processing...");
      setProgress(job.progress || 0);
      
      if (job.status === 'COMPLETED') {
        setDeploymentResult(job.result);
        return;
      } else if (job.status === 'FAILED') {
        setErrorMsg(job.error_message || "Pipeline execution failed.");
        return;
      }
      
      setTimeout(() => pollJob(jobId), 2000);
    } catch (e) {
      console.error("Failed to poll job", e);
      setTimeout(() => pollJob(jobId), 3000);
    }
  };

  const getStageStatus = (stage: string, index: number) => {
    const currentIndex = pipelineStages.findIndex(s => 
      currentStage.toLowerCase().includes(s.split(' ')[0].toLowerCase())
    );
    
    // Fallback logic if stage string doesn't match exactly
    let activeIdx = currentIndex;
    if (activeIdx === -1) {
      activeIdx = Math.floor((progress / 100) * pipelineStages.length);
    }

    if (deploymentResult || progress === 100) return 'completed';
    if (index < activeIdx) return 'completed';
    if (index === activeIdx) return 'running';
    return 'pending';
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono flex items-center gap-3">
          <Rocket className="w-8 h-8 text-primary" /> Pipeline Builder
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Target: <span className="font-bold text-foreground font-mono bg-secondary px-2 py-0.5 rounded">{targetColumn}</span>
        </p>
      </div>

      {errorMsg ? (
        <div className="bg-destructive/10 border-2 border-destructive p-6 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-destructive shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-destructive">Pipeline Failed</h2>
            <pre className="text-sm text-destructive mt-2 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto p-4 bg-background rounded-lg border border-destructive/20">{errorMsg}</pre>
          </div>
        </div>
      ) : !deploymentResult ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 border-r border-border pr-8">
            <h3 className="font-bold font-mono mb-6 text-muted-foreground uppercase tracking-wider text-sm">Execution Stages</h3>
            <div className="space-y-6 relative">
              <div className="absolute left-2.5 top-2 bottom-6 w-0.5 bg-border -z-10" />
              {pipelineStages.map((stage, idx) => {
                const status = getStageStatus(stage, idx);
                return (
                  <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="bg-background">
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                      ) : status === 'running' ? (
                        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground shrink-0" />
                      )}
                    </div>
                    <span className={`font-mono text-sm ${status === 'running' ? "text-primary font-bold" : "text-foreground"}`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-xl p-8 h-[400px] flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
              <h2 className="text-2xl font-bold font-mono text-foreground mb-2">{currentStage}</h2>
              <p className="text-muted-foreground font-mono">{progress}% Complete</p>
              
              <div className="w-full max-w-sm h-2 bg-muted rounded-full mt-8 overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-success/10 border-2 border-success p-8 rounded-xl text-center">
            <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              <CheckCircle2 className="w-10 h-10 text-background" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2 font-mono">Pipeline Completed</h2>
            <p className="text-success max-w-lg mx-auto">
              Your AutoML pipeline is ready. Below are your empirical results and downloadable artifacts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" /> Winning Model: <span className="font-mono text-primary bg-primary/10 px-2 rounded">{deploymentResult.best_model.name}</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(deploymentResult.best_model.metrics).filter(([key]) => key !== 'cv_scores').map(([key, value]) => (
                  <div key={key} className="bg-muted/50 p-4 rounded-lg border border-border text-center">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{key.replace('_', ' ')}</div>
                    <div className="text-xl font-bold font-mono text-foreground">
                      {typeof value === 'number' ? value.toFixed(4) : value as string}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push(`/studio/experiments`)}
                className="w-full py-3 text-sm text-primary hover:bg-primary/5 rounded-md border border-primary/20 transition-colors font-medium"
              >
                View Full Model Comparison
              </button>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl space-y-6 flex flex-col justify-center">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Rocket className="w-5 h-5 text-primary" /> Download Artifacts
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={() => downloadFile(`v1/datasets/${datasetId}/download_model/?model_name=pipeline`, 'pipeline.pkl')}
                  className="w-full p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between hover:bg-primary/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-md group-hover:scale-110 transition-transform">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-foreground">Pipeline Model (.pkl)</div>
                      <div className="text-xs text-muted-foreground">Production-ready scikit-learn pipeline</div>
                    </div>
                  </div>
                  <LinkIcon className="w-5 h-5 text-primary" />
                </button>
                
                <button 
                  onClick={() => downloadFile(`v1/datasets/${datasetId}/download_notebook/`, 'reproducible_pipeline.ipynb')}
                  className="w-full p-4 bg-secondary/10 border border-secondary/30 rounded-lg flex items-center justify-between hover:bg-secondary/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/20 rounded-md group-hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-foreground">Reproducible Notebook (.ipynb)</div>
                      <div className="text-xs text-muted-foreground">Jupyter notebook with complete code</div>
                    </div>
                  </div>
                  <LinkIcon className="w-5 h-5 text-secondary" />
                </button>
                
                <button 
                  onClick={() => downloadFile(`v1/datasets/${datasetId}/download_report/`, 'automl_evaluation_report.pdf')}
                  className="w-full p-4 bg-success/10 border border-success/30 rounded-lg flex items-center justify-between hover:bg-success/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/20 rounded-md group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-foreground">Evaluation Report (.pdf)</div>
                      <div className="text-xs text-muted-foreground">Comprehensive performance metrics</div>
                    </div>
                  </div>
                  <LinkIcon className="w-5 h-5 text-success" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
