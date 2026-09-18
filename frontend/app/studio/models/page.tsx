"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BrainCircuit, Loader2, Download, Star } from "lucide-react";
import api, { downloadFile } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("v1/deployments/")
      .then(res => setModels(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Models & Pipelines</h1>
          <p className="text-muted-foreground">Your registry of trained machine learning pipelines.</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : models.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-dashed border-border flex flex-col items-center">
              <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
              <p>No models found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {models.map(model => (
                <div key={model.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-muted/20 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg text-foreground font-mono">
                        {model.model_name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-success/20 text-success border border-success/30">
                        Ready
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">Target Variable: <span className="font-mono text-foreground">{model.target_column}</span></p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-1 rounded">Created: {new Date(model.created_at).toLocaleString()}</span>
                      {model.schema?.metrics && (
                        <div className="flex gap-3">
                          {Object.entries(model.schema.metrics).filter(([k]) => k !== 'cv_scores').slice(0, 3).map(([k, v]: any) => (
                            <span key={k} className="bg-secondary/50 px-2 py-1 rounded border border-border">
                              {k}: <span className="font-bold font-mono">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <button 
                      onClick={() => downloadFile(`v1/datasets/${model.dataset}/download_model/?model_name=pipeline`, 'pipeline.pkl')}
                      className="px-3 py-2 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" /> .pkl
                    </button>
                    <button 
                      onClick={() => downloadFile(`v1/datasets/${model.dataset}/download_report/`, 'report.pdf')}
                      className="px-3 py-2 bg-secondary text-foreground rounded border border-border hover:bg-muted transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Download className="w-4 h-4" /> Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
