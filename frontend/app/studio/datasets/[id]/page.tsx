"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Loader2, ArrowRight, BarChart3, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { motion } from "framer-motion";

export default function DatasetOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const datasetId = params.id as string;
  const { setDatasetId } = useAppContext();
  
  const [dataset, setDataset] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;
    setDatasetId(datasetId);

    const fetchData = async () => {
      try {
        const [dsRes, analysisRes] = await Promise.all([
          api.get(`v1/datasets/${datasetId}/`),
          api.get(`v1/datasets/${datasetId}/analyze/`)
        ]);
        setDataset(dsRes.data);
        setAnalysis(analysisRes.data);
      } catch (error) {
        console.error("Failed to fetch dataset details", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [datasetId, setDatasetId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-bold font-mono">Profiling Dataset...</h2>
        <p className="text-muted-foreground">Extracting metadata, detecting data types, and checking for anomalies.</p>
      </div>
    );
  }

  if (!dataset || !analysis) {
    return <div className="text-center text-muted-foreground mt-20">Dataset not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" /> Dataset Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
            We have profiled your dataset. Review the characteristics below before proceeding to target selection.
          </p>
        </div>
        <button
          onClick={() => router.push(`/studio/projects/${dataset.project}/target`)}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2"
        >
          Select Target <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Filename</div>
            <div className="text-lg font-bold truncate" title={dataset.file_name}>{dataset.file_name}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Rows</div>
            <div className="text-3xl font-mono font-bold text-foreground">{analysis.num_rows?.toLocaleString() || dataset.row_count?.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Columns</div>
            <div className="text-3xl font-mono font-bold text-foreground">{analysis.num_columns || dataset.column_count}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">File Size</div>
            <div className="text-3xl font-mono font-bold text-foreground">{(dataset.file_size / (1024 * 1024)).toFixed(2)} MB</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Feature Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Numerical Features</span>
                  <span className="font-mono font-bold">{analysis.numerical_columns?.length || 0}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((analysis.numerical_columns?.length || 0) / (analysis.num_columns || 1)) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Categorical Features</span>
                  <span className="font-mono font-bold">{analysis.categorical_columns?.length || 0}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-secondary" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((analysis.categorical_columns?.length || 0) / (analysis.num_columns || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Datetime Features</span>
                  <span className="font-mono font-bold">{analysis.datetime_columns?.length || 0}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-success" 
                    initial={{ width: 0 }}
                    animate={{ width: `${((analysis.datetime_columns?.length || 0) / (analysis.num_columns || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" /> Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-1">Missing Values</div>
              <div className="text-2xl font-mono font-bold text-foreground">
                {analysis.missing_values_total || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total cells with missing data</div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-1">Duplicate Rows</div>
              <div className="text-2xl font-mono font-bold text-foreground">
                {analysis.duplicate_rows || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Identical records detected</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
