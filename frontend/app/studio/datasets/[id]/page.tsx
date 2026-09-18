"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Loader2, ArrowRight, BarChart3, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
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

  if (!dataset || !analysis || !analysis.dataset) {
    return <div className="text-center text-muted-foreground mt-20">Dataset profile not ready or not found.</div>;
  }

  const ds = analysis.dataset;
  const columns = analysis.columns || {};
  const colKeys = Object.keys(columns);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" /> Dataset Overview
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
            Review your intelligent dataset profile. Check for anomalies, identifiers, and missing data before selecting your target.
          </p>
        </div>
        <button
          onClick={() => router.push(`/studio/projects/${dataset.project}/target`)}
          className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-2"
        >
          Select Target <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Filename</div>
            <div className="text-lg font-bold truncate" title={dataset.file_name}>{dataset.file_name}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2 flex justify-between">
              Rows {ds.is_sampled && <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">Sampled</span>}
            </div>
            <div className="text-3xl font-mono font-bold text-foreground">{ds.rows?.toLocaleString() || dataset.row_count?.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Columns</div>
            <div className="text-3xl font-mono font-bold text-foreground">{ds.columns || dataset.column_count}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">File Size</div>
            <div className="text-3xl font-mono font-bold text-foreground">{ds.size_mb} MB</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Data Types */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Feature Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { label: "Numerical", count: ds.types_breakdown?.numeric, color: "bg-blue-500" },
                { label: "Categorical", count: ds.types_breakdown?.categorical, color: "bg-purple-500" },
                { label: "Boolean", count: ds.types_breakdown?.boolean, color: "bg-green-500" },
                { label: "Datetime", count: ds.types_breakdown?.datetime, color: "bg-amber-500" },
                { label: "Text", count: ds.types_breakdown?.text, color: "bg-pink-500" }
              ].map((type) => (
                <div key={type.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">{type.label} Features</span>
                    <span className="font-mono font-bold">{type.count || 0}</span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${type.color}`} 
                      initial={{ width: 0 }}
                      animate={{ width: `${((type.count || 0) / (ds.columns || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Quality */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" /> Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <div className="text-sm font-medium">Missing Values</div>
                <div className="text-xs text-muted-foreground">{ds.missing_pct}% of total cells</div>
              </div>
              <div className="text-xl font-mono font-bold">{ds.missing_pct}%</div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <div className="text-sm font-medium">Duplicate Rows</div>
                <div className="text-xs text-muted-foreground">{ds.duplicate_pct}% of dataset</div>
              </div>
              <div className="text-xl font-mono font-bold">{ds.duplicate_rows}</div>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <div className="text-sm font-medium">Potential IDs</div>
                <div className="text-xs text-muted-foreground">Columns acting like identifiers</div>
              </div>
              <div className="text-xl font-mono font-bold text-warning">{ds.potential_identifiers?.length || 0}</div>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border">
              <div>
                <div className="text-sm font-medium">Constant Columns</div>
                <div className="text-xs text-muted-foreground">Columns with only 1 unique value</div>
              </div>
              <div className="text-xl font-mono font-bold text-destructive">{ds.constant_columns?.length || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Column Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Column Name</th>
                  <th className="px-4 py-3">Inferred Type</th>
                  <th className="px-4 py-3">Missing</th>
                  <th className="px-4 py-3">Unique</th>
                  <th className="px-4 py-3 rounded-tr-lg">Key Insights</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {colKeys.map((colName) => {
                  const col = columns[colName];
                  return (
                    <tr key={colName} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">
                        {colName}
                        {col.is_identifier && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/20 text-warning">ID</span>}
                      </td>
                      <td className="px-4 py-3 capitalize">{col.inferred_type}</td>
                      <td className="px-4 py-3">
                        <span className={col.missing_pct > 0 ? "text-warning" : "text-success"}>
                          {col.missing_pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3">{col.unique_pct}% ({col.unique_count})</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {col.inferred_type === 'numeric' && (
                          <div className="flex gap-4">
                            <span>Mean: {col.mean?.toFixed(2)}</span>
                            <span>Std: {col.std?.toFixed(2)}</span>
                            {col.outlier_count > 0 && <span className="text-warning">Outliers: {col.outlier_count}</span>}
                          </div>
                        )}
                        {(col.inferred_type === 'categorical' || col.inferred_type === 'boolean') && (
                          <div className="flex gap-4">
                            <span>Top: {col.most_frequent}</span>
                            {col.rare_category_pct > 0 && <span>Rare: {col.rare_category_pct}%</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
