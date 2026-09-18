"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Loader2, ArrowRight, Wand2, ShieldAlert, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function TargetSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { datasetId } = useAppContext();
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [problemType, setProblemType] = useState<string>("auto");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!datasetId) {
      router.push("/studio/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const [suggestRes, dsRes] = await Promise.all([
          api.get(`v1/datasets/${datasetId}/suggest_targets/`),
          api.get(`v1/datasets/${datasetId}/analyze/`)
        ]);
        
        const fetchedSuggestions = suggestRes.data.suggestions || [];
        setSuggestions(fetchedSuggestions);
        
        if (fetchedSuggestions.length > 0) {
          setSelectedTarget(fetchedSuggestions[0].column);
        }
        
        setColumns(dsRes.data.columns ? Object.keys(dsRes.data.columns) : []);
      } catch (error) {
        console.error("Failed to fetch target suggestions", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [datasetId, router]);

  const handleContinue = async () => {
    if (!selectedTarget) return;
    setIsSubmitting(true);
    
    try {
      await api.post(`v1/datasets/${datasetId}/set_target/`, {
        target_column: selectedTarget,
        problem_type: problemType
      });
      // Proceed to AI Analysis workflow
      router.push(`/studio/projects/${projectId}/ai-analysis`);
    } catch (error) {
      console.error("Failed to set target column", error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Analyzing Target Candidates...</h2>
        <p className="text-muted-foreground">Scoring columns based on naming, cardinality, and data types.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <Target className="w-8 h-8 text-primary" /> Target Selection
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Select the column you want the machine learning model to predict. Our engine has scored and ranked the best candidates for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" /> Suggested Targets
          </h3>
          <div className="space-y-3">
            {suggestions.map((target, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTarget(target.column)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex flex-col gap-2 ${
                  selectedTarget === target.column 
                    ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(56,189,248,0.2)]" 
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono font-bold text-lg">{target.column}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      target.confidence === 'High' ? 'bg-success/20 text-success' :
                      target.confidence === 'Medium' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'
                    }`}>
                      {target.confidence} Confidence
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  Detected Type: <span className="text-foreground">{target.detected_type}</span>
                </div>
                
                <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                  {target.reasons?.map((r: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> 
                      {r}
                    </li>
                  ))}
                  {target.leakage_warning && (
                    <li className="flex items-start gap-1.5 text-destructive font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
                      Warning: Potential data leakage detected from naming.
                    </li>
                  )}
                </ul>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <label className="block text-sm font-medium mb-2">Or select manually from all columns:</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none appearance-none font-mono text-sm"
            >
              <option value="" disabled>Select a column...</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border sticky top-6">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Problem Type</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'auto' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="auto" checked={problemType === 'auto'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Auto Detect</div>
                      <div className="text-xs text-muted-foreground">Let AI determine classification or regression based on target signature.</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'Binary Classification' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="Binary Classification" checked={problemType === 'Binary Classification'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Binary Classification</div>
                      <div className="text-xs text-muted-foreground">Predict between exactly two discrete categories.</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'Multiclass Classification' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="Multiclass Classification" checked={problemType === 'Multiclass Classification'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Multiclass Classification</div>
                      <div className="text-xs text-muted-foreground">Predict a discrete category from three or more options.</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'Regression' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="Regression" checked={problemType === 'Regression'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Regression</div>
                      <div className="text-xs text-muted-foreground">Predict a continuous numerical value.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-border">
                <button
                  onClick={handleContinue}
                  disabled={!selectedTarget || isSubmitting}
                  className="w-full px-6 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Saving Target...</>
                  ) : (
                    <>Confirm & Proceed <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
