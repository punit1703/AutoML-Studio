"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, GitMerge, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function PreprocessingPlanPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { datasetId } = useAppContext();
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState("standard");

  useEffect(() => {
    if (!datasetId) {
      router.push("/studio/dashboard");
      return;
    }

    const fetchPlan = async () => {
      try {
        const res = await api.get(`v1/datasets/${datasetId}/preprocessing_plan/`);
        setPlan(res.data.plan);
      } catch (error) {
        console.error("Failed to fetch preprocessing plan", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, [datasetId, router]);

  const handleBuildPipeline = async () => {
    localStorage.setItem(`training_budget_${datasetId}`, budget);
    // Navigate to model training / next step
    router.push(`/studio/projects/${projectId}/train`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Building Preprocessing Pipeline...</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Analyzing column signatures to generate a zero-leakage scikit-learn ColumnTransformer plan.
        </p>
      </div>
    );
  }

  if (!plan) {
    return <div className="text-center text-muted-foreground mt-20">Failed to generate preprocessing plan. Please ensure target is selected.</div>;
  }

  const columns = Object.entries(plan);
  
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <GitMerge className="w-8 h-8 text-primary" /> Preprocessing Plan
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Review the automated feature engineering pipeline. This pipeline will be strictly fitted on training data and baked into the final `.pkl` model to prevent data leakage.
        </p>
      </div>

      <div className="space-y-4">
        {columns.map(([colName, config]: [string, any]) => {
          const isTarget = config.type === "target";
          const isExcluded = config.action === "exclude";
          const hasWarnings = config.warnings && config.warnings.length > 0;
          
          return (
            <Card key={colName} className={`border ${isTarget ? 'border-primary shadow-[0_0_10px_rgba(56,189,248,0.2)] bg-primary/5' : isExcluded ? 'border-border opacity-60' : 'border-border'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold font-mono">{colName}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        isTarget ? 'bg-primary/20 text-primary' : 
                        isExcluded ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}>
                        {config.type}
                      </span>
                      {!isExcluded && !isTarget && (
                        <span className="text-xs px-2 py-0.5 rounded font-bold bg-success/20 text-success">
                          Included
                        </span>
                      )}
                      {isExcluded && !isTarget && (
                        <span className="text-xs px-2 py-0.5 rounded font-bold bg-destructive/20 text-destructive">
                          Dropped
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${isExcluded ? 'text-destructive' : 'text-success'}`} />
                      {config.reason}
                    </p>
                  </div>
                  
                  {!isExcluded && !isTarget && (
                    <div className="flex gap-2 flex-wrap max-w-xs justify-end">
                       {config.missing !== 'none' && (
                         <span className="text-xs bg-secondary px-2 py-1 rounded">Missing: {config.missing}</span>
                       )}
                       {config.scaling !== 'none' && (
                         <span className="text-xs bg-secondary px-2 py-1 rounded">Scale: {config.scaling}</span>
                       )}
                       {config.encoding !== 'none' && (
                         <span className="text-xs bg-secondary px-2 py-1 rounded">Encode: {config.encoding}</span>
                       )}
                       {config.action === 'extract_datetime' && (
                         <span className="text-xs bg-secondary px-2 py-1 rounded">Extract Datetime</span>
                       )}
                    </div>
                  )}
                </div>
                
                {hasWarnings && (
                  <div className="mt-4 space-y-2">
                    {config.warnings.map((warning: string, i: number) => {
                      const isLeakage = warning.toLowerCase().includes("leakage");
                      return (
                        <div key={i} className={`text-xs flex items-center gap-2 p-2 rounded border ${
                          isLeakage ? 'bg-destructive/10 border-destructive text-destructive font-bold' : 'bg-warning/10 border-warning text-warning'
                        }`}>
                          {isLeakage ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          {warning}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end pt-4 border-t border-border gap-4">
        <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-lg border border-border">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Training Budget:</span>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="bg-background border border-border text-foreground text-sm rounded focus:ring-primary focus:border-primary block p-2 font-mono"
          >
            <option value="fast">Fast (Quick baseline, small sample)</option>
            <option value="standard">Standard (Balanced, good for most)</option>
            <option value="thorough">Thorough (Exhaustive search)</option>
          </select>
        </div>
        <button
          onClick={handleBuildPipeline}
          className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2"
        >
          Accept & Build Pipeline <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
