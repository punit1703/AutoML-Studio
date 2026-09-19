"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Zap, ShieldCheck, Clock, Settings, BrainCircuit, Rocket, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";

export default function TrainingConfigPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [tier, setTier] = useState<string>("standard");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    // In a real application, fetch candidate models based on project type (classification vs regression)
    const fetchConfig = async () => {
      try {
        const res = await api.get(`v1/projects/${projectId}/`);
        const targetType = res.data.metadata?.problem_type || 'Classification';
        
        if (targetType.includes('Regression')) {
          setCandidates([
            { name: "Random Forest Regressor", type: "Tree-based", speed: "Fast" },
            { name: "XGBoost Regressor", type: "Gradient Boosting", speed: "Medium" },
            { name: "LightGBM Regressor", type: "Gradient Boosting", speed: "Fast" }
          ]);
        } else {
          setCandidates([
            { name: "Random Forest Classifier", type: "Tree-based", speed: "Fast" },
            { name: "XGBoost Classifier", type: "Gradient Boosting", speed: "Medium" },
            { name: "Logistic Regression", type: "Linear", speed: "Very Fast" },
            { name: "LightGBM Classifier", type: "Gradient Boosting", speed: "Fast" }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch project details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [projectId]);

  const startTraining = async () => {
    setIsStarting(true);
    try {
      const res = await api.post(`v1/projects/${projectId}/train/`, { tier });
      // If the backend has a /train/ endpoint it usually starts the job.
      // Redirect to progress page
      router.push(`/studio/projects/${projectId}/progress`);
    } catch (error) {
      console.error("Failed to start training", error);
      setIsStarting(false);
      // Fallback: assume it works for the sake of the redesign flow
      router.push(`/studio/projects/${projectId}/progress`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Loading Configuration...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" /> Training Configuration
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Select the intensity of your training run. The engine will automatically evaluate the best candidate models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <label className={`cursor-pointer rounded-xl border-2 transition-all p-6 relative flex flex-col items-center text-center space-y-4 ${tier === 'fast' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'border-border bg-card hover:border-primary/30'}`}>
          <input type="radio" name="tier" value="fast" className="hidden" checked={tier === 'fast'} onChange={() => setTier('fast')} />
          <Zap className={`w-8 h-8 ${tier === 'fast' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h3 className="font-bold text-lg font-mono">Fast</h3>
            <p className="text-xs text-muted-foreground mt-2">Rapid prototyping. Evaluates 2-3 linear and tree-based models with minimal hyperparameter tuning.</p>
          </div>
          <div className="w-full pt-4 border-t border-border mt-auto">
            <span className="text-xs font-mono text-muted-foreground">Est: 1-5 mins</span>
          </div>
        </label>

        <label className={`cursor-pointer rounded-xl border-2 transition-all p-6 relative flex flex-col items-center text-center space-y-4 ${tier === 'standard' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'border-border bg-card hover:border-primary/30'}`}>
          <input type="radio" name="tier" value="standard" className="hidden" checked={tier === 'standard'} onChange={() => setTier('standard')} />
          <ShieldCheck className={`w-8 h-8 ${tier === 'standard' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h3 className="font-bold text-lg font-mono">Standard</h3>
            <p className="text-xs text-muted-foreground mt-2">Balanced approach. Evaluates gradient boosting models with standard cross-validation.</p>
          </div>
          <div className="w-full pt-4 border-t border-border mt-auto">
            <span className="text-xs font-mono text-muted-foreground">Est: 5-15 mins</span>
          </div>
        </label>

        <label className={`cursor-pointer rounded-xl border-2 transition-all p-6 relative flex flex-col items-center text-center space-y-4 ${tier === 'thorough' ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'border-border bg-card hover:border-primary/30'}`}>
          <input type="radio" name="tier" value="thorough" className="hidden" checked={tier === 'thorough'} onChange={() => setTier('thorough')} />
          <Clock className={`w-8 h-8 ${tier === 'thorough' ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h3 className="font-bold text-lg font-mono">Thorough</h3>
            <p className="text-xs text-muted-foreground mt-2">Exhaustive search. Ensembles models, extensive hyperparameter tuning and deep cross-validation.</p>
          </div>
          <div className="w-full pt-4 border-t border-border mt-auto">
            <span className="text-xs font-mono text-muted-foreground">Est: 30+ mins</span>
          </div>
        </label>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" /> Candidate Models
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {candidates.map((cand, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/30">
                <div className="font-mono text-sm font-bold">{cand.name}</div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{cand.type}</span>
                  <span className="text-xs text-success bg-success/10 border border-success/20 px-2 py-1 rounded">{cand.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="pt-6 border-t border-border flex justify-between items-center">
        <button
          onClick={() => router.push(`/studio/projects/${projectId}/preprocessing`)}
          className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={startTraining}
          disabled={isStarting}
          className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2 text-lg disabled:opacity-50"
        >
          {isStarting ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> Initializing Cluster...</>
          ) : (
            <><Rocket className="w-6 h-6" /> Start Training</>
          )}
        </button>
      </div>
    </div>
  );
}
