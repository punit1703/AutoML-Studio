"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  Box, 
  Layers, 
  Network,
  ChevronRight,
  StopCircle,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";

// Available Algorithms Mock
const AVAILABLE_ALGORITHMS = [
  { id: "rf", name: "Random Forest", icon: Box, color: "text-emerald-500", bg: "bg-emerald-500/10", timeEstimate: "1-2 min" },
  { id: "xgb", name: "XGBoost", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10", timeEstimate: "2-4 min" },
  { id: "lgb", name: "LightGBM", icon: Layers, color: "text-amber-500", bg: "bg-amber-500/10", timeEstimate: "1-3 min" },
  { id: "nn", name: "Neural Network", icon: Network, color: "text-purple-500", bg: "bg-purple-500/10", timeEstimate: "5-10 min" },
];

export default function ModelTrainingPage() {
  const router = useRouter();
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>(["rf", "xgb", "lgb"]);
  
  // State: "idle" | "running" | "completed"
  const [trainingState, setTrainingState] = useState<"idle" | "running" | "completed">("idle");
  const [currentAlgoIndex, setCurrentAlgoIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] AutoML Engine initialized and ready."]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const toggleAlgo = (id: string) => {
    if (trainingState !== "idle") return;
    setSelectedAlgos(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const startTraining = () => {
    if (selectedAlgos.length === 0) {
      addLog("[ERROR] No algorithms selected for training.");
      return;
    }
    
    setTrainingState("running");
    setProgress(0);
    setCurrentAlgoIndex(0);
    setLogs(["[SYSTEM] AutoML Engine initialized.", "[SYSTEM] Starting Model Training Pipeline..."]);

    let currentIdx = 0;
    let currentProgress = 0;
    
    const totalSteps = selectedAlgos.length * 20; // 20 steps per algorithm
    
    const interval = setInterval(() => {
      currentProgress++;
      const overallPercentage = Math.floor((currentProgress / totalSteps) * 100);
      setProgress(overallPercentage);
      
      const algoId = selectedAlgos[currentIdx];
      const algoName = AVAILABLE_ALGORITHMS.find(a => a.id === algoId)?.name;
      
      const stepInAlgo = currentProgress - (currentIdx * 20);
      
      if (stepInAlgo === 1) {
        addLog(`[INFO] 🚀 Starting training for ${algoName}...`);
      } else if (stepInAlgo % 4 === 0 && stepInAlgo < 20) {
        const loss = (Math.random() * 0.5 + 0.1).toFixed(4);
        const acc = (Math.random() * 10 + 80).toFixed(2);
        addLog(`[${algoName}] Epoch ${stepInAlgo * 5}/100 - Loss: ${loss} - Accuracy: ${acc}%`);
      } else if (stepInAlgo === 20) {
        addLog(`[SUCCESS] ✅ ${algoName} training completed successfully.`);
        currentIdx++;
        if (currentIdx < selectedAlgos.length) {
          setCurrentAlgoIndex(currentIdx);
        } else {
          // All done
          clearInterval(interval);
          setTrainingState("completed");
          setProgress(100);
          addLog("[SYSTEM] 🎉 All models trained successfully! Pipeline finished.");
        }
      }
      
    }, 400); // adjust speed of simulation here
  };

  const stopTraining = () => {
    // In a real app, you'd send an abort signal to the backend
    setTrainingState("idle");
    addLog("[WARNING] 🛑 Training manually aborted by user.");
    setProgress(0);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            Model Training
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Select your target algorithms and initiate the automated hyperparameter tuning and model training pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {trainingState === "running" ? (
            <Button onClick={stopTraining} variant="destructive" className="shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <StopCircle className="w-4 h-4 mr-2" /> Stop Training
            </Button>
          ) : trainingState === "completed" ? (
            <Button onClick={() => router.push("/studio/evaluation")} className="bg-success text-black hover:bg-success/90 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              Continue to Evaluation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={startTraining} className="shadow-[0_0_15px_rgba(56,189,248,0.4)]">
              Start Training <Play className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Algorithms & Status */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#09090b] border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Algorithms Setup</CardTitle>
              <CardDescription>Select models to include in the ensemble</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AVAILABLE_ALGORITHMS.map((algo, idx) => {
                const isSelected = selectedAlgos.includes(algo.id);
                const isCurrent = trainingState === "running" && selectedAlgos[currentAlgoIndex] === algo.id;
                const isFinished = trainingState === "completed" || (trainingState === "running" && selectedAlgos.indexOf(algo.id) < currentAlgoIndex);
                const isPending = trainingState === "running" && selectedAlgos.indexOf(algo.id) > currentAlgoIndex;
                const Icon = algo.icon;

                return (
                  <motion.div
                    key={algo.id}
                    whileHover={trainingState === "idle" ? { scale: 1.02 } : {}}
                    whileTap={trainingState === "idle" ? { scale: 0.98 } : {}}
                    onClick={() => toggleAlgo(algo.id)}
                    className={`relative p-4 rounded-xl border flex items-center justify-between transition-all ${
                      trainingState === "idle" ? 'cursor-pointer' : 'cursor-default opacity-80'
                    } ${
                      isSelected 
                        ? isCurrent ? 'bg-primary/5 border-primary/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                        : 'bg-white/5 border-white/20' 
                        : 'bg-black/40 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? algo.bg : 'bg-white/5'} ${isSelected ? algo.color : 'text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{algo.name}</div>
                        <div className="text-xs text-muted-foreground">Est. {algo.timeEstimate}</div>
                      </div>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex items-center">
                      {trainingState === "idle" && (
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary border-primary text-black' : 'border-white/20'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                      )}
                      
                      {isCurrent && (
                        <span className="flex items-center text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full animate-pulse border border-primary/20">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Training
                        </span>
                      )}
                      
                      {isFinished && isSelected && (
                        <span className="flex items-center text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                        </span>
                      )}
                      
                      {isPending && isSelected && (
                        <span className="flex items-center text-xs font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
                          Pending
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Terminal & Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col overflow-hidden">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-lg font-mono tracking-tight">Execution Logs</CardTitle>
                </div>
                
                {/* Global Progress Header */}
                {(trainingState === "running" || trainingState === "completed") && (
                  <div className="flex items-center gap-4 w-1/2 justify-end">
                    <div className="text-sm font-mono text-muted-foreground">Overall Progress</div>
                    <div className="flex-1 max-w-[150px]">
                      <Progress 
                        value={progress} 
                        className="h-2 bg-black/50 border border-white/10" 
                        indicatorClassName={trainingState === "completed" ? "bg-success" : "bg-primary"}
                      />
                    </div>
                    <div className="text-sm font-mono font-bold text-white w-10 text-right">{progress}%</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
              {/* Terminal Window */}
              <div className="absolute inset-0 bg-[#000000] p-4 font-mono text-sm overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {logs.map((log, index) => {
                    // Syntax highlighting for logs
                    let color = "text-muted-foreground";
                    if (log.includes("[INFO]")) color = "text-blue-400";
                    if (log.includes("[SUCCESS]") || log.includes("✅") || log.includes("🎉")) color = "text-emerald-400 font-medium";
                    if (log.includes("[WARNING]") || log.includes("🛑")) color = "text-amber-400";
                    if (log.includes("[ERROR]")) color = "text-rose-400";
                    if (log.includes("[SYSTEM]")) color = "text-purple-400";
                    
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-1 leading-relaxed ${color}`}
                      >
                        {log}
                      </motion.div>
                    );
                  })}
                  
                  {/* Blinking cursor when running */}
                  {trainingState === "running" && (
                    <motion.div 
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-2 h-4 bg-primary inline-block ml-1 align-middle"
                    />
                  )}
                </AnimatePresence>
                
                {/* Invisible element to anchor scrolling */}
                <div ref={logsEndRef} className="h-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
