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



export default function DataPreprocessingPage() {
  const router = useRouter();
  const { datasetId } = useAppContext();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState<"idle" | "running" | "completed">("idle");
  const [currentAction, setCurrentAction] = useState("");

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
      const config: any = {
        missing_values: { strategy: 'mean', fill_value: 0 },
        encode_one_hot: {},
        scale: { method: 'standard' },
        outliers: { action: 'clip', method: 'iqr' }
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Wand2 className="w-6 h-6 text-primary" />
            </div>
            Data Preprocessing
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            The ML engine will automatically clean and transform your dataset using optimal strategies before training.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border text-foreground hover:bg-white/10" onClick={() => router.back()}>
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
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      {processStatus === "completed" ? (
                        <span className="text-success flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Pipeline Executed Successfully</span>
                      ) : (
                        <span className="text-primary flex items-center gap-2"><Settings2 className="w-5 h-5 animate-spin" /> Running Preprocessing Pipeline</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">{currentAction}</p>
                  </div>
                  <div className="text-2xl font-mono font-bold text-foreground">{progress}%</div>
                </div>
                <Progress 
                  value={progress} 
                  className="h-3 bg-secondary/50 border border-border/50" 
                  indicatorClassName={processStatus === "completed" ? "bg-success" : "bg-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]"} 
                />
                
                {processStatus === "completed" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    className="mt-6 flex justify-end"
                  >
                    <Button onClick={() => router.push("/studio/training")} className="bg-success text-background hover:bg-success/90 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
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
        <Card className="border-border transition-colors bg-white/[0.03]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <FileWarning className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Missing Values</CardTitle>
                  <CardDescription>Handled automatically (Impute Mean/Mode)</CardDescription>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
        </Card>

        {/* Encoding Card */}
        <Card className="border-border transition-colors bg-white/[0.03]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Binary className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Categorical Encoding</CardTitle>
                  <CardDescription>Handled automatically (One-Hot Encoding)</CardDescription>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
        </Card>

        {/* Scaling Card */}
        <Card className="border-border transition-colors bg-white/[0.03]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Maximize className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Feature Scaling</CardTitle>
                  <CardDescription>Handled automatically (Standard Scaler)</CardDescription>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
        </Card>

        {/* Outliers Card */}
        <Card className="border-border transition-colors bg-white/[0.03]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Handle Outliers</CardTitle>
                  <CardDescription>Handled automatically (Clip Extreme Anomalies)</CardDescription>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
