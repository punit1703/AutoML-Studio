"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import api from "@/lib/api";
import { 
  CheckCircle2, Loader2, Target, Wand2, Rocket, ArrowRight, BarChart2, Star, Link as LinkIcon
} from "lucide-react";

type PipelineStep = "analysis" | "target-selection" | "execution" | "deployment";

export default function PipelinePage() {
  const router = useRouter();
  const { datasetId, projectId } = useAppContext();
  
  const [currentStep, setCurrentStep] = React.useState<PipelineStep>("analysis");
  const [analysisData, setAnalysisData] = React.useState<any>(null);
  const [targetSuggestions, setTargetSuggestions] = React.useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null);
  
  const [executionLog, setExecutionLog] = React.useState<string[]>([
    "Dataset Validation",
    "Missing Value Handling",
    "Duplicate Removal",
    "Encoding & Feature Engineering",
    "Problem Type Detection",
    "Model Selection",
    "Hyperparameter Optimization",
    "Model Comparison",
    "Evaluation",
    "Model Saving",
    "Prediction App Generation",
    "Deployment"
  ]);
  const [currentExecutionIndex, setCurrentExecutionIndex] = React.useState<number>(0);
  const [deploymentResult, setDeploymentResult] = React.useState<any>(null);

  React.useEffect(() => {
    if (!datasetId) {
      router.push("/studio/upload");
      return;
    }

    const loadAnalysis = async () => {
      try {
        const analyzeRes = await api.get(`v1/datasets/${datasetId}/analyze/`);
        setAnalysisData(analyzeRes.data);
        
        const targetRes = await api.get(`v1/datasets/${datasetId}/suggest_targets/`);
        setTargetSuggestions(targetRes.data.suggestions || []);
        
        // Wait 1.5s just for visual effect before going to target selection
        setTimeout(() => {
          setCurrentStep("target-selection");
        }, 1500);
        
      } catch (e) {
        console.error(e);
      }
    };

    loadAnalysis();
  }, [datasetId, router]);

  const startPipeline = async () => {
    if (!selectedTarget || !datasetId) return;
    
    setCurrentStep("execution");
    
    // Simulate progression for visual effect, but we also make the real API call
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < executionLog.length - 1) {
        setCurrentExecutionIndex(idx);
      } else {
        clearInterval(interval);
      }
    }, 1500);

    try {
      const res = await api.post(`v1/datasets/${datasetId}/run_pipeline/`, { target_column: selectedTarget });
      setDeploymentResult(res.data);
      clearInterval(interval);
      setCurrentExecutionIndex(executionLog.length); // complete all
      setTimeout(() => {
        setCurrentStep("deployment");
      }, 1000);
    } catch (e) {
      console.error(e);
      clearInterval(interval);
      alert("Pipeline failed. See console.");
    }
  };

  const shareableUrl = deploymentResult ? `${window.location.origin}/predict/${deploymentResult.deployment_id}` : "";

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-primary" /> AI Pipeline Builder
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
          Automated end-to-end processing. We analyze your data, train the best models, and deploy a prediction application with zero configuration.
        </p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* Step 1 & 2: Analysis & Target Selection */}
        {(currentStep === "analysis" || currentStep === "target-selection") && (
          <motion.div
            key="target-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="md:col-span-1 space-y-4">
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <BarChart2 className="w-5 h-5 text-primary" /> Dataset Summary
                </h3>
                {analysisData ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Rows</span>
                      <span className="font-mono text-foreground">{analysisData.dataset_info?.num_rows || 0}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Columns</span>
                      <span className="font-mono text-foreground">{analysisData.dataset_info?.num_columns || 0}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground">Missing Values</span>
                      <span className="font-mono text-warning">Total missing handled automatically</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing dataset...
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-full">
                {currentStep === "analysis" ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-4 py-12 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p>Detecting optimal targets...</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-primary" /> Select Target Column
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      What do you want to predict? We have analyzed the dataset and suggested the best candidates.
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      {targetSuggestions.map((target, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTarget(target.column)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                            selectedTarget === target.column 
                              ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]" 
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                        >
                          <div>
                            <span className="font-mono font-bold text-foreground text-lg">{target.column}</span>
                          </div>
                          <div className="flex gap-1 text-yellow-500">
                            {target.stars}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={startPipeline}
                        disabled={!selectedTarget}
                        className="px-6 py-3 bg-primary text-background font-bold rounded-lg disabled:opacity-50 flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)]"
                      >
                        Start AI Pipeline <Rocket className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Execution Progress */}
        {currentStep === "execution" && (
          <motion.div
            key="execution"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card border border-border p-8 rounded-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentExecutionIndex / executionLog.length) * 100}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" /> Building AI Model...
              </h2>

              <div className="space-y-4">
                {executionLog.map((step, idx) => {
                  const isCompleted = idx < currentExecutionIndex;
                  const isActive = idx === currentExecutionIndex;
                  const isPending = idx > currentExecutionIndex;

                  return (
                    <div key={idx} className={`flex items-center gap-4 transition-all duration-300 ${isPending ? "opacity-30" : "opacity-100"}`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground shrink-0" />
                      )}
                      <span className={`font-mono text-sm ${isActive ? "text-primary font-bold scale-105" : "text-foreground"}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Deployment */}
        {currentStep === "deployment" && deploymentResult && (
          <motion.div
            key="deployment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-success/10 border-2 border-success p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                <CheckCircle2 className="w-8 h-8 text-background" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Deployment Successful</h2>
              <p className="text-success max-w-lg mx-auto">
                Your AI prediction application is live. Share the link below with your users to start making predictions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border p-6 rounded-xl">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                  <Rocket className="w-5 h-5 text-primary" /> Application Details
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Public Prediction Link</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted border border-border p-3 rounded font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                        {shareableUrl}
                      </div>
                      <button 
                        onClick={() => window.open(shareableUrl, '_blank')}
                        className="p-3 bg-primary text-background rounded hover:bg-primary/90 transition-colors shrink-0"
                      >
                        <LinkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted border border-border rounded-lg">
                    <div className="text-sm font-medium mb-1">Status: <span className="text-success">Active & Ready</span></div>
                    <div className="text-sm font-medium">Model: <span className="text-primary">{deploymentResult.best_model.name}</span></div>
                    <div className="text-sm font-medium">Target: <span className="text-foreground">{selectedTarget}</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border p-6 rounded-xl">
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-primary" /> Model Performance
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(deploymentResult.best_model.metrics).map(([key, value]) => (
                    <div key={key} className="bg-muted p-4 rounded-lg border border-border text-center">
                      <div className="text-sm text-muted-foreground mb-1 uppercase tracking-wider">{key.replace('_', ' ')}</div>
                      <div className="text-xl font-bold font-mono">
                        {typeof value === 'number' ? value.toFixed(4) : value as string}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
