"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2, GitBranch, Settings2, BarChart3, Database } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";

export default function PreprocessingReviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this fetches the generated preprocessing pipeline
    // For now, we fallback to analyzing dataset or fetching project details to mock/get plan
    const fetchPlan = async () => {
      try {
        const res = await api.get(`v1/projects/${projectId}/preprocessing_plan/`).catch(() => null);
        if (res?.data) {
          setPlan(res.data);
        } else {
          // Fallback if endpoint doesn't exist yet, we simulate based on project info
          const projRes = await api.get(`v1/projects/${projectId}/`);
          const dsId = projRes.data.primary_dataset_id;
          if (dsId) {
            const analyzeRes = await api.get(`v1/datasets/${dsId}/analyze/`);
            const cols = analyzeRes.data.columns;
            const simulatedPlan = {
              numerical: { imputation: "mean", scaling: "standard", columns: [] as string[] },
              categorical: { imputation: "mode", encoding: "one-hot", columns: [] as string[] },
              boolean: { imputation: "mode", encoding: "passthrough", columns: [] as string[] },
              text: { vectorizer: "tfidf", columns: [] as string[] },
              dropped: [] as string[]
            };
            
            Object.entries(cols).forEach(([colName, details]: any) => {
              if (details.is_identifier || details.missing_pct > 90) {
                simulatedPlan.dropped.push(colName);
              } else if (details.inferred_type === 'numeric') {
                simulatedPlan.numerical.columns.push(colName);
              } else if (details.inferred_type === 'categorical') {
                simulatedPlan.categorical.columns.push(colName);
              } else if (details.inferred_type === 'boolean') {
                simulatedPlan.boolean.columns.push(colName);
              } else if (details.inferred_type === 'text') {
                simulatedPlan.text.columns.push(colName);
              }
            });
            setPlan(simulatedPlan);
          }
        }
      } catch (error) {
        console.error("Failed to fetch preprocessing plan", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlan();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Generating Preprocessing Plan...</h2>
        <p className="text-muted-foreground">Analyzing data types to determine the optimal transformation pipeline.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
          <GitBranch className="w-8 h-8 text-primary" /> Preprocessing Review
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Review the automated data transformation pipeline before configuring the training phase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plan?.numerical?.columns?.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" /> Numerical Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted p-3 rounded">
                    <span className="text-muted-foreground block text-xs">Imputation</span>
                    <span className="font-bold capitalize">{plan.numerical.imputation}</span>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <span className="text-muted-foreground block text-xs">Scaling</span>
                    <span className="font-bold capitalize">{plan.numerical.scaling}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">Columns ({plan.numerical.columns.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {plan.numerical.columns.slice(0, 8).map((col: string) => (
                      <span key={col} className="text-xs font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded">
                        {col}
                      </span>
                    ))}
                    {plan.numerical.columns.length > 8 && <span className="text-xs text-muted-foreground px-2 py-1">+{plan.numerical.columns.length - 8} more</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {plan?.categorical?.columns?.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-500" /> Categorical Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-muted p-3 rounded">
                    <span className="text-muted-foreground block text-xs">Imputation</span>
                    <span className="font-bold capitalize">{plan.categorical.imputation}</span>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <span className="text-muted-foreground block text-xs">Encoding</span>
                    <span className="font-bold capitalize">{plan.categorical.encoding}</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground mb-1 block">Columns ({plan.categorical.columns.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {plan.categorical.columns.slice(0, 8).map((col: string) => (
                      <span key={col} className="text-xs font-mono bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-1 rounded">
                        {col}
                      </span>
                    ))}
                    {plan.categorical.columns.length > 8 && <span className="text-xs text-muted-foreground px-2 py-1">+{plan.categorical.columns.length - 8} more</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {plan?.dropped?.length > 0 && (
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                <Settings2 className="w-5 h-5" /> Excluded Columns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">These columns are dropped due to high missingness or being unique identifiers.</p>
              <div className="flex flex-wrap gap-2">
                {plan.dropped.map((col: string) => (
                  <span key={col} className="text-xs font-mono bg-muted text-muted-foreground border border-border px-2 py-1 rounded">
                    {col}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="pt-6 border-t border-border flex justify-between items-center">
        <button
          onClick={() => router.push(`/studio/projects/${projectId}/target`)}
          className="px-6 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => router.push(`/studio/projects/${projectId}/training`)}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2"
        >
          Configure Training <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
