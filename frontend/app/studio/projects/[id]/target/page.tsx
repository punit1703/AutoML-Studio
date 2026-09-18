"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Loader2, ArrowRight, Wand2 } from "lucide-react";
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
        setSuggestions(suggestRes.data.suggestions || []);
        if (suggestRes.data.suggestions?.length > 0) {
          setSelectedTarget(suggestRes.data.suggestions[0].column);
        }
        setColumns(dsRes.data.columns || []);
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [datasetId, router]);

  const handleContinue = () => {
    if (!selectedTarget) return;
    setIsSubmitting(true);
    
    // Store problem type choice locally or pass via query params
    localStorage.setItem(`problem_type_${datasetId}`, problemType);
    localStorage.setItem(`target_column_${datasetId}`, selectedTarget);
    
    // Proceed to AI Analysis
    router.push(`/studio/projects/${projectId}/ai-analysis`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Analyzing Candidates...</h2>
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
          Select the column you want the machine learning model to predict.
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
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                  selectedTarget === target.column 
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]" 
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="font-mono font-bold text-foreground">{target.column}</span>
                <span className="text-warning text-xs tracking-widest">{target.stars}</span>
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
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Problem Type</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'auto' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="auto" checked={problemType === 'auto'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Auto Detect</div>
                      <div className="text-xs text-muted-foreground">Let AI determine if this is classification or regression</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'classification' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="classification" checked={problemType === 'classification'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Classification</div>
                      <div className="text-xs text-muted-foreground">Predict a discrete category or class label</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${problemType === 'regression' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                    <input type="radio" name="problemType" value="regression" checked={problemType === 'regression'} onChange={(e) => setProblemType(e.target.value)} className="accent-primary w-4 h-4" />
                    <div>
                      <div className="font-bold text-sm">Regression</div>
                      <div className="text-xs text-muted-foreground">Predict a continuous numerical value</div>
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
                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating AI Analysis...</>
                  ) : (
                    <>Run AI Dataset Analysis <ArrowRight className="w-5 h-5" /></>
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
