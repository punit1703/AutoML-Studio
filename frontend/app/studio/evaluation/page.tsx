"use client";

import React, { useState } from "react";
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
  Grid2X2
} from "lucide-react";
import { 
  LineChart, Line, 
  BarChart, Bar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { useRouter } from "next/navigation";

// Mock Data
const bestModel = {
  name: "XGBoost Classifier",
  accuracy: "94.8%",
  f1: "0.93",
  auc: "0.98",
  trainTime: "2m 14s"
};

const comparisonData = [
  { name: "XGBoost", accuracy: 0.948, precision: 0.952, recall: 0.931, f1: 0.941, auc: 0.982 },
  { name: "LightGBM", accuracy: 0.935, precision: 0.940, recall: 0.915, f1: 0.927, auc: 0.975 },
  { name: "Random Forest", accuracy: 0.912, precision: 0.905, recall: 0.890, f1: 0.897, auc: 0.950 },
  { name: "Neural Network", accuracy: 0.928, precision: 0.918, recall: 0.920, f1: 0.919, auc: 0.965 },
];

const rocData = [
  { fpr: 0, tpr: 0, baseline: 0 },
  { fpr: 0.05, tpr: 0.65, baseline: 0.05 },
  { fpr: 0.1, tpr: 0.82, baseline: 0.1 },
  { fpr: 0.15, tpr: 0.89, baseline: 0.15 },
  { fpr: 0.2, tpr: 0.93, baseline: 0.2 },
  { fpr: 0.3, tpr: 0.95, baseline: 0.3 },
  { fpr: 0.4, tpr: 0.97, baseline: 0.4 },
  { fpr: 0.6, tpr: 0.985, baseline: 0.6 },
  { fpr: 0.8, tpr: 0.995, baseline: 0.8 },
  { fpr: 1, tpr: 1, baseline: 1 },
];

const featureImportanceData = [
  { name: "Income", value: 0.35 },
  { name: "Age", value: 0.28 },
  { name: "Credit_Score", value: 0.15 },
  { name: "Tenure", value: 0.12 },
  { name: "Balance", value: 0.08 },
  { name: "NumOfProducts", value: 0.02 },
];

// Confusion Matrix [Actual Negative, Actual Positive]
const confusionMatrixData = {
  tn: 1245, fp: 68,
  fn: 92, tp: 595
};

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "charts">("dashboard");

  const totalSamples = confusionMatrixData.tn + confusionMatrixData.fp + confusionMatrixData.fn + confusionMatrixData.tp;

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
          <Button className="bg-success text-black hover:bg-success/90 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
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
                  <h2 className="text-3xl font-bold text-white mb-1">{bestModel.name}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <GitCommit className="w-4 h-4" /> Selected automatically based on validation AUC
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                  <Target className="w-6 h-6 text-emerald-500 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{bestModel.accuracy}</h3>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
                  <TrendingUp className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">ROC AUC</p>
                  <h3 className="text-3xl font-bold text-white mt-1">{bestModel.auc}</h3>
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
                          <th className="px-6 py-4 font-medium">Accuracy</th>
                          <th className="px-6 py-4 font-medium">Precision</th>
                          <th className="px-6 py-4 font-medium">Recall</th>
                          <th className="px-6 py-4 font-medium">F1 Score</th>
                          <th className="px-6 py-4 font-medium text-primary">AUC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {comparisonData.map((row, i) => (
                          <tr key={i} className={`hover:bg-white/5 transition-colors ${i === 0 ? 'bg-primary/5' : ''}`}>
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                              {i === 0 && <Trophy className="w-4 h-4 text-primary" />}
                              {row.name}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">{(row.accuracy * 100).toFixed(1)}%</td>
                            <td className="px-6 py-4 text-muted-foreground">{row.precision.toFixed(3)}</td>
                            <td className="px-6 py-4 text-muted-foreground">{row.recall.toFixed(3)}</td>
                            <td className="px-6 py-4 text-muted-foreground">{row.f1.toFixed(3)}</td>
                            <td className={`px-6 py-4 font-bold ${i === 0 ? 'text-primary' : 'text-white'}`}>{row.auc.toFixed(3)}</td>
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

        {activeTab === "charts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROC Curve */}
            <motion.div variants={itemVariants}>
              <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">ROC Curve</CardTitle>
                  </div>
                  <CardDescription>Receiver Operating Characteristic</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rocData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis type="number" dataKey="fpr" name="False Positive Rate" domain={[0, 1]} stroke="#ffffff50" fontSize={12} tickFormatter={(v) => v.toFixed(1)} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -10, fill: '#ffffff50', fontSize: 12 }} />
                      <YAxis type="number" dataKey="tpr" name="True Positive Rate" domain={[0, 1]} stroke="#ffffff50" fontSize={12} tickFormatter={(v) => v.toFixed(1)} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', offset: 10, fill: '#ffffff50', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="tpr" name="XGBoost (AUC=0.98)" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="baseline" name="Random Classifier" stroke="#ffffff50" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
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
                  <CardDescription>Predicted vs Actual classifications</CardDescription>
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
                            <span className="text-3xl font-bold text-white">{confusionMatrixData.tn}</span>
                            <span className="text-xs text-muted-foreground mt-1">True Negative</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{((confusionMatrixData.tn / totalSamples) * 100).toFixed(1)}%</span>
                          </div>
                          
                          {/* FP */}
                          <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{confusionMatrixData.fp}</span>
                            <span className="text-xs text-rose-300 mt-1">False Positive</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{((confusionMatrixData.fp / totalSamples) * 100).toFixed(1)}%</span>
                          </div>
                          
                          {/* FN */}
                          <div className="bg-rose-500/20 border border-rose-500/30 rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{confusionMatrixData.fn}</span>
                            <span className="text-xs text-rose-300 mt-1">False Negative</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{((confusionMatrixData.fn / totalSamples) * 100).toFixed(1)}%</span>
                          </div>
                          
                          {/* TP */}
                          <div className="bg-primary/40 border border-primary/50 shadow-[0_0_15px_rgba(56,189,248,0.2)] rounded-lg flex flex-col items-center justify-center p-4 relative group">
                            <span className="text-3xl font-bold text-white">{confusionMatrixData.tp}</span>
                            <span className="text-xs text-primary-foreground mt-1">True Positive</span>
                            <span className="absolute top-2 right-2 text-[10px] text-white/50">{((confusionMatrixData.tp / totalSamples) * 100).toFixed(1)}%</span>
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

            {/* Radar Metrics Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <CardTitle className="text-lg">Multidimensional Metrics Breakdown</CardTitle>
                  </div>
                  <CardDescription>Radar chart comparing top 2 models across all evaluation metrics</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { metric: 'Accuracy', XGBoost: 0.948, LightGBM: 0.935 },
                      { metric: 'Precision', XGBoost: 0.952, LightGBM: 0.940 },
                      { metric: 'Recall', XGBoost: 0.931, LightGBM: 0.915 },
                      { metric: 'F1 Score', XGBoost: 0.941, LightGBM: 0.927 },
                      { metric: 'AUC', XGBoost: 0.982, LightGBM: 0.975 },
                    ]}>
                      <PolarGrid stroke="#ffffff20" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0.8, 1]} tickCount={3} tick={{ fill: '#ffffff50', fontSize: 10 }} />
                      <Radar name="XGBoost" dataKey="XGBoost" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
                      <Radar name="LightGBM" dataKey="LightGBM" stroke="#f472b6" fill="#f472b6" fillOpacity={0.4} />
                      <Legend verticalAlign="bottom" height={36} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
