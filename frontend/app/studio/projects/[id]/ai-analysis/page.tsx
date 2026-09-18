"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, BrainCircuit, Check, Edit2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";

export default function AIAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { datasetId } = useAppContext();
  
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [problemTypeOverride, setProblemTypeOverride] = useState<string>("auto");

  useEffect(() => {
    if (!datasetId) {
      router.push("/studio/dashboard");
      return;
    }

    const savedTarget = localStorage.getItem(`target_column_${datasetId}`) || "";
    const savedProblemType = localStorage.getItem(`problem_type_${datasetId}`) || "auto";
    
    setTargetColumn(savedTarget);
    setProblemTypeOverride(savedProblemType);

    if (!savedTarget) {
      router.push(`/studio/projects/${projectId}/target`);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        // This triggers Grok recommendation because target_column is provided
        const res = await api.get(`v1/datasets/${datasetId}/analyze/?target_column=${savedTarget}`);
        setAnalysis(res.data.ai_recommendation || null);
      } catch (error) {
        console.error("Failed to fetch AI analysis", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [datasetId, projectId, router]);

  const handleBuildPipeline = async () => {
    // Navigate to the visual Pipeline Builder executor
    router.push("/studio/pipeline");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Grok is analyzing your dataset...</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Sending dataset characteristics to xAI Grok to determine the optimal preprocessing strategy, candidate models, and problem type.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return <div className="text-center text-muted-foreground mt-20">Failed to generate AI analysis.</div>;
  }

  // Use the override if provided, otherwise the AI's detection
  const finalProblemType = problemTypeOverride !== 'auto' ? problemTypeOverride : (analysis.problem_type || 'classification');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" /> AI Dataset Analysis
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Review and customize Grok's recommended machine learning strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Target Column</div>
            <div className="text-xl font-mono font-bold text-primary">{targetColumn}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">Problem Type</div>
            <div className="text-xl font-mono font-bold text-foreground capitalize">
              {finalProblemType}
            </div>
            {problemTypeOverride === 'auto' && (
              <div className="text-xs text-primary mt-1 flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> Auto-detected by Grok
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-8">
            
            {/* Preprocessing */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-mono">Recommended Preprocessing</h3>
                <button className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(analysis.preprocessing || {}).map(([key, value]: any) => (
                  <div key={key} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-sm capitalize">{key.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Models */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-mono">Candidate Models</h3>
                <button className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(analysis.candidate_models || []).map((model: string) => (
                  <div key={model} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary font-mono text-sm rounded flex items-center gap-2">
                    <Check className="w-3 h-3" /> {model}
                  </div>
                ))}
              </div>
            </div>

            {/* Visualizations */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold font-mono">Visualizations to Generate</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(analysis.visualizations || []).map((viz: string) => (
                  <div key={viz} className="px-3 py-1.5 bg-secondary border border-border text-foreground font-mono text-sm rounded flex items-center gap-2">
                    <Check className="w-3 h-3 text-muted-foreground" /> {viz}
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end pt-4 border-t border-border">
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
