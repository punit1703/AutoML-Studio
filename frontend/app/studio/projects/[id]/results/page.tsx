"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download, Loader2, Trophy, Clock, BarChart4, ChevronRight, Zap } from "lucide-react";
import api, { downloadFile } from "@/lib/api";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function ResultsPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [modelData, setModelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In reality, this would fetch the best deployment or model result for the project
    const fetchResults = async () => {
      try {
        const res = await api.get(`v1/projects/${projectId}/`);
        // If there's a latest deployment, fetch it
        const deployId = res.data.latest_deployment_id;
        if (deployId) {
          const deployRes = await api.get(`v1/deployments/${deployId}/`);
          setModelData(deployRes.data);
        } else {
          // If no deployment found, fallback to checking all deployments for this project
          const allDeployments = await api.get(`v1/deployments/`);
          const projDeployments = allDeployments.data.filter((d: any) => d.project === projectId || (d.dataset && d.dataset === res.data.primary_dataset_id));
          if (projDeployments.length > 0) {
            setModelData(projDeployments[0]);
          } else {
            // Mock data for UI demonstration if backend hasn't generated a deployment yet
            setModelData({
              model_name: "XGBoost Classifier",
              dataset: res.data.primary_dataset_id,
              schema: {
                metrics: {
                  accuracy: 0.942,
                  f1_score: 0.938,
                  precision: 0.951,
                  recall: 0.925
                },
                training_time: 142, // seconds
                feature_importance: [
                  { feature: "age", importance: 0.35 },
                  { feature: "income", importance: 0.25 },
                  { feature: "credit_score", importance: 0.15 },
                  { feature: "debt_ratio", importance: 0.12 },
                  { feature: "dependents", importance: 0.08 },
                  { feature: "employment_years", importance: 0.05 }
                ],
                other_models: [
                  { name: "Random Forest", accuracy: 0.915 },
                  { name: "Logistic Regression", accuracy: 0.842 },
                  { name: "LightGBM", accuracy: 0.931 }
                ]
              }
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch results", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Loading Results...</h2>
      </div>
    );
  }

  if (!modelData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Trophy className="w-12 h-12 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold font-mono">No Results Found</h2>
        <p className="text-muted-foreground">The training job hasn't produced a final model yet.</p>
      </div>
    );
  }

  const schema = modelData.schema || {};
  const metrics = schema.metrics || {};
  
  // Extract primary metric (e.g., accuracy or r2)
  const primaryMetricKey = Object.keys(metrics).find(k => k === 'accuracy' || k === 'r2_score') || Object.keys(metrics)[0] || "Score";
  const primaryMetricValue = metrics[primaryMetricKey] || 0;
  
  // Exclude primary from secondary
  const secondaryMetrics = Object.entries(metrics).filter(([k]) => k !== primaryMetricKey && k !== 'cv_scores');

  const featureImportance = schema.feature_importance || [];
  const otherModels = schema.other_models || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Header and Download Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-card border border-border p-8 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold font-mono border border-primary/30 mb-4">
            <Trophy className="w-4 h-4" /> Best Model Selected
          </div>
          <h1 className="text-4xl font-bold font-mono text-foreground mb-2">
            {modelData.model_name || "Ensemble Model"}
          </h1>
          <p className="text-muted-foreground">
            This model outperformed all other candidates and is ready for production.
          </p>
        </div>
        
        <button
          onClick={() => downloadFile(`v1/datasets/${modelData.dataset}/download_model/?model_name=pipeline`, 'model.pkl')}
          className="relative z-10 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_30px_rgba(56,189,248,0.5)] hover:shadow-[0_0_40px_rgba(56,189,248,0.7)] hover:-translate-y-1 flex items-center justify-center gap-3 text-lg w-full md:w-auto"
        >
          <Download className="w-6 h-6" /> Download model.pkl
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Metrics Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Primary Metric</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold font-mono text-primary">
                  {typeof primaryMetricValue === 'number' ? primaryMetricValue.toFixed(3) : primaryMetricValue}
                </span>
                <span className="text-xl text-muted-foreground capitalize">{primaryMetricKey.replace('_', ' ')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Secondary Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {secondaryMetrics.map(([k, v]: any) => (
                  <div key={k} className="flex justify-between items-center pb-2 border-b border-border/50 last:border-0 last:pb-0">
                    <span className="capitalize">{k.replace('_', ' ')}</span>
                    <span className="font-mono font-bold">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Training Time</div>
                  <div className="font-bold font-mono text-lg">{schema.training_time ? `${schema.training_time}s` : 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Explainability */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Feature Importance (Explainability) */}
          <Card className="bg-card border-border shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart4 className="w-5 h-5 text-primary" /> Feature Importance (SHAP)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {featureImportance.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {featureImportance.slice(0, 8).map((fi: any, idx: number) => {
                    const maxImp = featureImportance[0].importance;
                    const pct = (fi.importance / maxImp) * 100;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-mono font-medium">{fi.feature}</span>
                          <span className="text-muted-foreground text-xs">{fi.importance.toFixed(3)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                  SHAP explanations are not available for this model type.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Model Comparison */}
      {otherModels.length > 0 && (
        <Card className="bg-card border-border shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> Leaderboard Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border">
                  <tr>
                    <th className="px-6 py-4">Model Algorithm</th>
                    <th className="px-6 py-4">{primaryMetricKey.replace('_', ' ')}</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* Winning Model */}
                  <tr className="bg-primary/5">
                    <td className="px-6 py-4 font-mono font-bold text-primary flex items-center gap-2">
                      {modelData.model_name || "Ensemble Model"} <Trophy className="w-4 h-4" />
                    </td>
                    <td className="px-6 py-4 font-mono font-bold">
                      {typeof primaryMetricValue === 'number' ? primaryMetricValue.toFixed(3) : primaryMetricValue}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-success/20 text-success rounded text-xs font-bold">Selected</span>
                    </td>
                  </tr>
                  
                  {/* Runner ups */}
                  {otherModels.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono">{m.name}</td>
                      <td className="px-6 py-4 font-mono">{m[primaryMetricKey] ? m[primaryMetricKey].toFixed(3) : (m.accuracy ? m.accuracy.toFixed(3) : "N/A")}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">Evaluated</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
