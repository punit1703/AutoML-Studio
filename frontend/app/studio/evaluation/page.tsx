"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Target, 
  Activity, 
  BarChart4, 
  Table as TableIcon,
  TrendingUp,
  GitCommit,
  CheckCircle2,
  Download,
  Grid2X2,
  Loader2
} from "lucide-react";
import { 
  LineChart, Line, 
  BarChart, Bar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

// Fallback Mock Data
const featureImportanceData = [
  { name: "Income", value: 0.35 },
  { name: "Age", value: 0.28 },
  { name: "Credit_Score", value: 0.15 },
  { name: "Tenure", value: 0.12 },
  { name: "Balance", value: 0.08 },
  { name: "NumOfProducts", value: 0.02 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function EvaluationPage() {
  const router = useRouter();
  const { datasetId } = useAppContext();
  const [activeTab, setActiveTab] = useState<"dashboard" | "charts">("dashboard");
  const [loading, setLoading] = useState(true);
  
  const [evaluationData, setEvaluationData] = useState<any>(null);

  useEffect(() => {
    if (datasetId) {
      setLoading(true);
      api.get(`v1/datasets/${datasetId}/analyze/`).then(res => {
        const numCols = res.data.numerical_columns || [];
        const catCols = res.data.categorical_columns || [];
        const allCols = [...numCols, ...catCols];
        
        let target = "";
        const suggested = res.data.suggested_targets || [];
        if (suggested.length > 0) {
          target = suggested[0];
        } else if (allCols.length > 0) {
          target = allCols[allCols.length - 1];
        }

        if (target) {
          api.post(`v1/datasets/${datasetId}/evaluate/`, { target_column: target }).then(evalRes => {
            setEvaluationData(evalRes.data);
            setLoading(false);
          }).catch(err => {
            console.error(err);
            setLoading(false);
          });
        }
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [datasetId]);

  if (loading) {
    return <div className="w-full flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  
  if (!evaluationData) {
    return <div className="text-center p-12 text-muted-foreground">Evaluation failed or no model trained. Please go back to Training.</div>;
  }

  const results = evaluationData.evaluation_results || [];
  const bestModelName = evaluationData.best_model || (results.length > 0 ? results[0].model_name : "Unknown");
  const bestModelData = results.find((r: any) => r.model_name === bestModelName) || results[0];
  const problemType = evaluationData.problem_type;
  
  const bestModelMetrics = bestModelData?.metrics || {};
  
  let comparisonData = results.map((r: any) => ({
    name: r.model_name,
    accuracy: r.metrics.accuracy || r.metrics.r2 || 0,
    precision: r.metrics.precision || 0,
    recall: r.metrics.recall || 0,
    f1: r.metrics.f1 || 0,
    auc: r.metrics.roc?.auc || 0,
    mae: r.metrics.mae || 0,
    rmse: r.metrics.rmse || 0,
    r2: r.metrics.r2 || 0
  }));

  // Confusion matrix
  const cm = bestModelMetrics.confusion_matrix || [[0,0], [0,0]];
  const tn = cm[0]?.[0] || 0;
  const fp = cm[0]?.[1] || 0;
  const fn = cm[1]?.[0] || 0;
  const tp = cm[1]?.[1] || 0;
  const totalSamples = tn + fp + fn + tp;
  
  // ROC Data
  let rocData: any[] = [];
  if (bestModelMetrics.roc) {
    const fprs = bestModelMetrics.roc.fpr;
    const tprs = bestModelMetrics.roc.tpr;
    // Downsample if too large for recharts, though usually fine
    for (let i = 0; i < fprs.length; i++) {
      rocData.push({ fpr: fprs[i], tpr: tprs[i], baseline: fprs[i] });
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            Model Evaluation
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Review the performance metrics of your trained models and select the best candidate for deployment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10" onClick={() => router.push("/studio/downloads")}>
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
          <Button className="bg-success text-black hover:bg-success/90 shadow-[0_0_15px_rgba(34,197,94,0.4)]" onClick={() => router.push("/studio/downloads")}>
            Deploy Best Model <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>

      {/* Custom Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        {[
          { id: "dashboard", label: "Overview Dashboard", icon: BarChart4 },
          { id: "charts", label: "Diagnostic Charts", icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                isActive 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-white hover:border-white/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeEvaluationTab"
                  className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                />
              )}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Best Model Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(56,189,248,0.15)] md:col-span-2">
                <CardContent className="p-6 flex flex-col justify-center h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Best Performing Model</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1">{bestModelName}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <GitCommit className="w-4 h-4" /> Selected automatically based on {problemType === 'regression' ? 'R2 Score' : 'Accuracy/F1'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                  <Target className="w-6 h-6 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">{problemType === 'regression' ? 'R2 Score' : 'Accuracy'}</p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {problemType === 'regression' 
                      ? (bestModelMetrics.r2 || 0).toFixed(3)
                      : ((bestModelMetrics.accuracy || 0) * 100).toFixed(1) + "%"}
                  </h3>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                  <TrendingUp className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">{problemType === 'regression' ? 'RMSE' : 'ROC AUC'}</p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {problemType === 'regression'
                      ? (bestModelMetrics.rmse || 0).toFixed(3)
                      : (bestModelMetrics.roc?.auc || 0).toFixed(3)}
                  </h3>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Comparison Table */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card className="bg-[#09090b] border-white/10 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-indigo-400" />
                      <CardTitle className="text-lg">Model Comparison</CardTitle>
                    </div>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 font-medium">Model</th>
                          {problemType === 'regression' ? (
                            <>
                              <th className="px-6 py-4 font-medium">R2 Score</th>
                              <th className="px-6 py-4 font-medium">RMSE</th>
                              <th className="px-6 py-4 font-medium">MAE</th>
                            </>
                          ) : (
                            <>
                              <th className="px-6 py-4 font-medium">Accuracy</th>
                              <th className="px-6 py-4 font-medium">Precision</th>
                              <th className="px-6 py-4 font-medium">Recall</th>
                              <th className="px-6 py-4 font-medium">F1 Score</th>
                              <th className="px-6 py-4 font-medium text-primary">AUC</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {comparisonData.map((row: any, i: number) => (
                          <tr key={i} className={`hover:bg-white/5 transition-colors ${i === 0 ? 'bg-primary/5' : ''}`}>
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                              {i === 0 && <Trophy className="w-4 h-4 text-primary" />}
                              {row.name}
                            </td>
                            {problemType === 'regression' ? (
                              <>
                                <td className={`px-6 py-4 ${i === 0 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>{row.r2.toFixed(3)}</td>
                                <td className="px-6 py-4 text-muted-foreground">{row.rmse.toFixed(3)}</td>
                                <td className="px-6 py-4 text-muted-foreground">{row.mae.toFixed(3)}</td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 text-muted-foreground">{(row.accuracy * 100).toFixed(1)}%</td>
                                <td className="px-6 py-4 text-muted-foreground">{row.precision.toFixed(3)}</td>
                                <td className="px-6 py-4 text-muted-foreground">{row.recall.toFixed(3)}</td>
                                <td className="px-6 py-4 text-muted-foreground">{row.f1.toFixed(3)}</td>
                                <td className={`px-6 py-4 font-bold ${i === 0 ? 'text-primary' : 'text-white'}`}>{row.auc.toFixed(3)}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>

              {/* Feature Importance */}
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <BarChart4 className="w-5 h-5 text-amber-500" />
                      <CardTitle className="text-lg">Feature Importance</CardTitle>
                    </div>
                    <CardDescription>Top features driving predictions</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={featureImportanceData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} hide />
                        <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <Tooltip 
                          cursor={{ fill: '#ffffff05' }}
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "charts" && problemType !== 'regression' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROC Curve */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">ROC Curve</CardTitle>
                  </div>
                  <CardDescription>Receiver Operating Characteristic for {bestModelName}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[350px]">
                  {rocData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rocData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis type="number" dataKey="fpr" name="False Positive Rate" domain={[0, 1]} stroke="#ffffff50" fontSize={12} tickFormatter={(v) => v.toFixed(1)} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -10, fill: '#ffffff50', fontSize: 12 }} />
                        <YAxis type="number" dataKey="tpr" name="True Positive Rate" domain={[0, 1]} stroke="#ffffff50" fontSize={12} tickFormatter={(v) => v.toFixed(1)} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: 10, fill: '#ffffff50', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="tpr" name={`${bestModelName} (AUC=${bestModelMetrics.roc?.auc?.toFixed(3)})`} stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="baseline" name="Random Classifier" stroke="#ffffff50" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">ROC data not available (multiclass or unsupported)</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Confusion Matrix */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Grid2X2 className="w-5 h-5 text-purple-500" />
                    <CardTitle className="text-lg">Confusion Matrix</CardTitle>
                  </div>
                  <CardDescription>Predicted vs Actual classifications for {bestModelName}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center justify-center p-6 min-h-[350px]">
                  
                  <div className="relative w-full max-w-[400px]">
                    {/* Top Labels */}
                    <div className="flex justify-center mb-4">
                      <div className="text-sm font-semibold text-white tracking-widest uppercase">Predicted Label</div>
                    </div>
                    
                    <div className="flex">
                      {/* Left Labels */}
                      <div className="flex flex-col justify-center mr-4 w-6">
                        <div className="text-sm font-semibold text-white tracking-widest uppercase -rotate-90 whitespace-nowrap origin-center translate-y-[20px]">
                          True Label
                        </div>
                      </div>
                      
                      {/* Matrix Grid */}
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-2 text-center text-sm font-medium text-white mb-2">
                          <div>Negative (0)</div>
                          <div>Positive (1)</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 aspect-square">
                          {/* TN */}
                          <div className="bg-primary/20 border border-primary/30 rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{tn}</span>
                            <span className="text-xs text-muted-foreground mt-1">True Negative</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{totalSamples > 0 ? ((tn / totalSamples) * 100).toFixed(1) : 0}%</span>
                          </div>
                          
                          {/* FP */}
                          <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{fp}</span>
                            <span className="text-xs text-rose-300 mt-1">False Positive</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{totalSamples > 0 ? ((fp / totalSamples) * 100).toFixed(1) : 0}%</span>
                          </div>
                          
                          {/* FN */}
                          <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{fn}</span>
                            <span className="text-xs text-rose-300 mt-1">False Negative</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{totalSamples > 0 ? ((fn / totalSamples) * 100).toFixed(1) : 0}%</span>
                          </div>
                          
                          {/* TP */}
                          <div className="bg-primary/40 border border-primary/50 shadow-[0_0_15px_rgba(56,189,248,0.2)] rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{tp}</span>
                            <span className="text-xs text-primary-foreground mt-1">True Positive</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{totalSamples > 0 ? ((tp / totalSamples) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-between h-full mt-2 absolute -left-12 top-10 bottom-6 py-12">
                          <div className="text-sm font-medium text-white rotate-[-90deg] translate-y-[-20px]">Negative (0)</div>
                          <div className="text-sm font-medium text-white rotate-[-90deg] translate-y-[20px]">Positive (1)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
