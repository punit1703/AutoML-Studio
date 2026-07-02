"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieChartIcon, Activity, Grid2X2, Maximize2, Loader2, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

export default function VisualizationPage() {
  const { datasetId } = useAppContext();
  const [columns, setColumns] = useState<{num: string[], cat: string[]}>({ num: [], cat: [] });
  const [charts, setCharts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (datasetId) {
      // First get analysis to know which columns to use
      api.get(`v1/datasets/${datasetId}/analyze/`).then(res => {
        const numCols = res.data.numerical_columns || [];
        const catCols = res.data.categorical_columns || [];
        setColumns({ num: numCols, cat: catCols });
        
        if (numCols.length > 0) {
          fetchChart('histogram', { column: numCols[0], bins: 30 });
          if (numCols.length > 1) {
            fetchChart('scatter', { x_column: numCols[0], y_column: numCols[1] });
          }
        }
        if (catCols.length > 0) {
          fetchChart('pie', { column: catCols[0] });
          if (numCols.length > 0) {
            fetchChart('boxplot', { column: numCols[0], by_column: catCols[0] });
          }
        }
        fetchChart('correlation', {});
      });
    }
  }, [datasetId]);

  const fetchChart = async (type: string, params: any) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await api.post(`v1/datasets/${datasetId}/visualize/`, {
        chart_type: type,
        params: params
      });
      setCharts(prev => ({ ...prev, [type]: "http://localhost:8000" + res.data.chart_url }));
    } catch (err) {
      console.error(`Failed to load ${type} chart`, err);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const renderChartBox = (title: string, desc: string, icon: React.ReactNode, type: string) => (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription>{desc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] w-full flex items-center justify-center p-4 bg-black/20 relative">
          {loading[type] ? (
            <div className="flex flex-col items-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <span className="text-sm">Generating visualization...</span>
            </div>
          ) : charts[type] ? (
            <div className="w-full h-full relative flex justify-center items-center overflow-hidden">
              <img src={charts[type]} alt={title} className="max-h-full max-w-full rounded-md object-contain" style={{ filter: 'invert(0.9) hue-rotate(180deg)' }} />
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <p>No chart data</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <PieChartIcon className="w-6 h-6 text-primary" />
            </div>
            Data Visualization
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Explore auto-generated visual representations of your dataset to uncover hidden patterns and correlations.
          </p>
        </div>
      </motion.div>

      {!datasetId ? (
        <div className="text-center p-12 text-muted-foreground">Please upload a dataset first.</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {renderChartBox("Feature Distribution", "Distribution of a numerical feature", <Activity className="w-5 h-5 text-blue-500" />, 'histogram')}
          {renderChartBox("Scatter Plot", "Relationship between two numerical features", <Grid2X2 className="w-5 h-5 text-purple-500" />, 'scatter')}
          {renderChartBox("Categorical Distribution", "Proportion of categories", <PieChartIcon className="w-5 h-5 text-pink-500" />, 'pie')}
          {renderChartBox("Boxplot Analysis", "Numerical distribution by category", <Maximize2 className="w-5 h-5 text-emerald-500" />, 'boxplot')}
          
          <div className="lg:col-span-2">
            {renderChartBox("Correlation Matrix", "Heatmap of numerical feature correlations", <Grid2X2 className="w-5 h-5 text-amber-500" />, 'correlation')}
          </div>
        </motion.div>
      )}
    </div>
  );
}
