"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wand2, 
  FileWarning, 
  Binary, 
  Maximize, 
  AlertTriangle,
  Play,
  CheckCircle2,
  Loader2,
  Settings2,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

// Custom Toggle Switch Component
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] ${
      checked ? "bg-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]" : "bg-white/20 hover:bg-white/30"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-1"
      }`}
    />
  </button>
);

export default function DataPreprocessingPage() {
  const router = useRouter();
  const { datasetId } = useAppContext();
  
  // Preprocessing State
  const [steps, setSteps] = useState({
    missingValues: { enabled: true, strategy: "impute_mean_mode" },
    encoding: { enabled: true, strategy: "one_hot" },
    scaling: { enabled: false, strategy: "standard" },
    outliers: { enabled: false, strategy: "clip" },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState<"idle" | "running" | "completed">("idle");
  const [currentAction, setCurrentAction] = useState("");

  const handleToggle = (step: keyof typeof steps) => {
    setSteps(prev => ({
      ...prev,
      [step]: { ...prev[step], enabled: !prev[step].enabled }
    }));
  };

  const handleChange = (step: keyof typeof steps, value: string) => {
    setSteps(prev => ({
      ...prev,
      [step]: { ...prev[step], strategy: value }
    }));
  };

  const startProcessing = async () => {
    if (!datasetId) {
      alert("No dataset selected");
      return;
    }

    setIsProcessing(true);
    setProcessStatus("running");
    setProgress(0);
    setCurrentAction("Initializing preprocessing engine...");
    
    try {
      const config = {
        missing_values: steps.missingValues.enabled ? steps.missingValues.strategy : 'none',
        encoding: steps.encoding.enabled ? steps.encoding.strategy : 'none',
        scaling: steps.scaling.enabled ? steps.scaling.strategy : 'none',
        outliers: steps.outliers.enabled ? steps.outliers.strategy : 'none'
      };
      
      // Simulate progress bar while waiting for the real backend API to finish
      let p = 0;
      const interval = setInterval(() => {
        p += 5;
        if (p < 90) setProgress(p);
      }, 300);

      await api.post(`v1/datasets/${datasetId}/preprocess/`, { config });
      
      clearInterval(interval);
      setProgress(100);
      setCurrentAction("Pipeline executed successfully!");
      setProcessStatus("completed");
      
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setProcessStatus("idle");
      alert("Failed to preprocess data. Please check logs.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            Data Preprocessing
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Configure how the ML engine should clean and transform your dataset before training. Toggle steps and adjust strategies as needed.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => router.back()}>
            Back
          </Button>
          <Button 
            onClick={startProcessing}
            disabled={isProcessing || processStatus === "completed"}
            className="shadow-[0_0_15px_rgba(56,189,248,0.4)] min-w-[180px]"
          >
            {processStatus === "completed" ? (
              <>Completed <CheckCircle2 className="w-4 h-4 ml-2" /></>
            ) : isProcessing ? (
              <>Processing... <Loader2 className="w-4 h-4 ml-2 animate-spin" /></>
            ) : (
              <>Execute Pipeline <Play className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar overlay/section */}
      <AnimatePresence>
        {(isProcessing || processStatus === "completed") && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(56,189,248,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]" />
              <CardContent className="p-6 relative z-10">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {processStatus === "completed" ? (
                        <span className="text-success flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Pipeline Executed Successfully</span>
                      ) : (
                        <span className="text-primary flex items-center gap-2"><Settings2 className="w-5 h-5 animate-spin" /> Running Preprocessing Pipeline</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">{currentAction}</p>
                  </div>
                  <div className="text-2xl font-mono font-bold text-white">{progress}%</div>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-black/50 border border-white/5" 
                  indicatorClassName={processStatus === "completed" ? "bg-success" : "bg-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]"} 
                />
                
                {processStatus === "completed" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    className="mt-6 flex justify-end"
                  >
                    <Button onClick={() => router.push("/studio/training")} className="bg-success text-black hover:bg-success/90 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      Continue to Training <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Values Card */}
        <Card className={`border-white/10 transition-colors ${steps.missingValues.enabled ? 'bg-white/[0.03]' : 'bg-black/40 opacity-70'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${steps.missingValues.enabled ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-muted-foreground'}`}>
                  <FileWarning className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Missing Values</CardTitle>
                  <CardDescription>Handle null or empty cells</CardDescription>
                </div>
              </div>
              <Switch checked={steps.missingValues.enabled} onChange={() => handleToggle('missingValues')} />
            </div>
          </CardHeader>
          <AnimatePresence>
            {steps.missingValues.enabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Imputation Strategy</label>
                      <select 
                        value={steps.missingValues.strategy}
                        onChange={(e) => handleChange('missingValues', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-md text-sm p-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      >
                        <option value="impute_mean_mode">Impute Mean/Mode (Recommended)</option>
                        <option value="impute_median">Impute Median</option>
                        <option value="impute_constant">Impute Constant (0 / 'Unknown')</option>
                        <option value="drop_rows">Drop Rows with Missing Values</option>
                        <option value="drop_cols">Drop Columns (&gt;50% missing)</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Encoding Card */}
        <Card className={`border-white/10 transition-colors ${steps.encoding.enabled ? 'bg-white/[0.03]' : 'bg-black/40 opacity-70'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${steps.encoding.enabled ? 'bg-purple-500/10 text-purple-500' : 'bg-white/5 text-muted-foreground'}`}>
                  <Binary className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Categorical Encoding</CardTitle>
                  <CardDescription>Convert text categories to numbers</CardDescription>
                </div>
              </div>
              <Switch checked={steps.encoding.enabled} onChange={() => handleToggle('encoding')} />
            </div>
          </CardHeader>
          <AnimatePresence>
            {steps.encoding.enabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Encoding Strategy</label>
                      <select 
                        value={steps.encoding.strategy}
                        onChange={(e) => handleChange('encoding', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-md text-sm p-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      >
                        <option value="one_hot">One-Hot Encoding (Best for nominal)</option>
                        <option value="label">Label Encoding (Best for ordinal)</option>
                        <option value="target">Target Encoding</option>
                        <option value="auto">Auto-select based on cardinality</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Scaling Card */}
        <Card className={`border-white/10 transition-colors ${steps.scaling.enabled ? 'bg-white/[0.03]' : 'bg-black/40 opacity-70'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${steps.scaling.enabled ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-muted-foreground'}`}>
                  <Maximize className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Feature Scaling</CardTitle>
                  <CardDescription>Normalize numerical ranges</CardDescription>
                </div>
              </div>
              <Switch checked={steps.scaling.enabled} onChange={() => handleToggle('scaling')} />
            </div>
          </CardHeader>
          <AnimatePresence>
            {steps.scaling.enabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Scaling Method</label>
                      <select 
                        value={steps.scaling.strategy}
                        onChange={(e) => handleChange('scaling', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-md text-sm p-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      >
                        <option value="standard">Standard Scaler (Z-Score)</option>
                        <option value="minmax">Min-Max Scaler (0 to 1)</option>
                        <option value="robust">Robust Scaler (Outlier resistant)</option>
                        <option value="maxabs">Max-Abs Scaler</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Outliers Card */}
        <Card className={`border-white/10 transition-colors ${steps.outliers.enabled ? 'bg-white/[0.03]' : 'bg-black/40 opacity-70'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${steps.outliers.enabled ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-muted-foreground'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Handle Outliers</CardTitle>
                  <CardDescription>Manage extreme numerical anomalies</CardDescription>
                </div>
              </div>
              <Switch checked={steps.outliers.enabled} onChange={() => handleToggle('outliers')} />
            </div>
          </CardHeader>
          <AnimatePresence>
            {steps.outliers.enabled && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CardContent>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Outlier Strategy</label>
                      <select 
                        value={steps.outliers.strategy}
                        onChange={(e) => handleChange('outliers', e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-md text-sm p-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      >
                        <option value="clip">Clip (Winsorize to 5th/95th percentile)</option>
                        <option value="drop">Drop Outlier Rows</option>
                        <option value="impute">Impute with Median</option>
                        <option value="ignore">Ignore</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
