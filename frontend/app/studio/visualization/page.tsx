"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  Legend
} from "recharts";
import { PieChart as PieChartIcon, BarChart2, Activity, Grid2X2, GitMerge, Maximize2 } from "lucide-react";

// Mock Data
const histogramData = [
  { range: "18-25", count: 120 },
  { range: "26-35", count: 350 },
  { range: "36-45", count: 480 },
  { range: "46-55", count: 290 },
  { range: "56-65", count: 150 },
  { range: "65+", count: 80 },
];

const scatterData = Array.from({ length: 60 }).map(() => ({
  x: Math.floor(Math.random() * 100000) + 20000, // Income
  y: Math.floor(Math.random() * 500) + 350,      // Credit Score
  z: Math.floor(Math.random() * 100) + 10,       // Size
}));

const pieData = [
  { name: "France", value: 5014 },
  { name: "Germany", value: 2509 },
  { name: "Spain", value: 2477 },
];
const pieColors = ["#38bdf8", "#818cf8", "#f472b6"];

const barChartData = [
  { name: "France", Retained: 4204, Churned: 810 },
  { name: "Germany", Retained: 1695, Churned: 814 },
  { name: "Spain", Retained: 2064, Churned: 413 },
];

// Heatmap Data (Correlation Matrix)
const features = ["Age", "Income", "Credit", "Tenure", "Balance"];
const heatmapData = [
  [1.00, 0.15, -0.03, 0.45, 0.02],
  [0.15, 1.00, 0.85, 0.12, 0.67],
  [-0.03, 0.85, 1.00, 0.05, 0.44],
  [0.45, 0.12, 0.05, 1.00, 0.11],
  [0.02, 0.67, 0.44, 0.11, 1.00],
];

// Boxplot Data
const boxPlotData = [
  { label: "Retained", min: 30000, q1: 50000, median: 75000, q3: 110000, max: 150000, color: "#38bdf8" },
  { label: "Churned", min: 20000, q1: 40000, median: 60000, q3: 90000, max: 130000, color: "#f472b6" },
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

export default function VisualizationPage() {
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
              <PieChartIcon className="w-6 h-6 text-primary" />
            </div>
            Data Visualization
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Explore interactive visual representations of your dataset to uncover hidden patterns, correlations, and distributions.
          </p>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Histogram */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-lg">Age Distribution (Histogram)</CardTitle>
              </div>
              <CardDescription>Frequency of customers across age groups</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="range" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Heatmap (Correlation Matrix) */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Grid2X2 className="w-4 h-4 text-purple-500" />
                <CardTitle className="text-lg">Correlation Matrix (Heatmap)</CardTitle>
              </div>
              <CardDescription>Pearson correlation coefficients between features</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center min-h-[300px] p-6">
              <div className="w-full aspect-square max-w-[320px] mx-auto grid grid-cols-5 gap-1">
                {heatmapData.map((row, i) => (
                  row.map((val, j) => {
                    // Determine color intensity based on correlation value
                    const absVal = Math.abs(val);
                    const isPositive = val >= 0;
                    const bgColor = isPositive 
                      ? `rgba(56, 189, 248, ${absVal * 0.9 + 0.1})` 
                      : `rgba(244, 114, 182, ${absVal * 0.9 + 0.1})`;
                    
                    return (
                      <motion.div 
                        key={`${i}-${j}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + (i * 5 + j) * 0.02 }}
                        className="w-full h-full rounded-sm flex items-center justify-center text-[10px] font-mono cursor-pointer relative group"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className={`${absVal > 0.5 ? 'text-black font-bold' : 'text-white/70'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {val.toFixed(2)}
                        </span>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-max bg-black border border-white/20 text-white text-xs py-1 px-2 rounded pointer-events-none">
                          {features[i]} vs {features[j]}: {val.toFixed(2)}
                        </div>
                      </motion.div>
                    )
                  })
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-4 max-w-[320px] mx-auto w-full px-2">
                {features.map((f, i) => <span key={i} className="w-1/5 text-center truncate">{f}</span>)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scatter Plot */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <CardTitle className="text-lg">Income vs Credit Score (Scatter)</CardTitle>
              </div>
              <CardDescription>Bivariate relationship with cluster groupings</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis type="number" dataKey="x" name="Income" stroke="#ffffff50" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                  <YAxis type="number" dataKey="y" name="Credit" stroke="#ffffff50" fontSize={12} />
                  <ZAxis type="number" dataKey="z" range={[20, 100]} name="Size" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                  />
                  <Scatter name="Customers" data={scatterData} fill="#10b981" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-400" />
                <CardTitle className="text-lg">Geographic Distribution (Pie)</CardTitle>
              </div>
              <CardDescription>Proportion of customers by country</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grouped Bar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-lg">Churn by Geography (Bar)</CardTitle>
              </div>
              <CardDescription>Target variable breakdown across regions</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Retained" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Churned" fill="#f472b6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Boxplot (Custom SVG) */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[#09090b] border-white/10 h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                <CardTitle className="text-lg">Income by Churn (Boxplot)</CardTitle>
              </div>
              <CardDescription>Statistical spread and outliers analysis</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex flex-col justify-center p-6 gap-8">
              {boxPlotData.map((data, i) => {
                // Map values to percentages (0 to 160000 range for mapping)
                const range = 160000;
                const mapToPct = (val: number) => (val / range) * 100;
                
                return (
                  <div key={i} className="relative w-full h-16 group">
                    <div className="text-sm text-white mb-2 font-medium">{data.label}</div>
                    <div className="relative w-full h-8 flex items-center">
                      {/* Scale Line */}
                      <div className="absolute w-full h-px bg-white/10" />
                      
                      {/* Min Whisker */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${mapToPct(data.q1) - mapToPct(data.min)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute h-px bg-white/40"
                        style={{ left: `${mapToPct(data.min)}%` }}
                      />
                      <div className="absolute w-px h-3 bg-white/60" style={{ left: `${mapToPct(data.min)}%` }} />
                      
                      {/* Box */}
                      <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: `${mapToPct(data.q3) - mapToPct(data.q1)}%`, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="absolute h-6 rounded-sm border border-white/20 shadow-lg cursor-pointer"
                        style={{ left: `${mapToPct(data.q1)}%`, backgroundColor: `${data.color}40`, borderColor: data.color }}
                      >
                        {/* Median Line */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_5px_rgba(255,255,255,0.5)]" 
                          style={{ left: `${mapToPct(data.median) - mapToPct(data.q1)}%` }} 
                        />
                      </motion.div>
                      
                      {/* Max Whisker */}
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${mapToPct(data.max) - mapToPct(data.q3)}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute h-px bg-white/40"
                        style={{ left: `${mapToPct(data.q3)}%` }}
                      />
                      <div className="absolute w-px h-3 bg-white/60" style={{ left: `${mapToPct(data.max)}%` }} />
                    </div>
                    
                    {/* Hover Stats */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 rounded-md px-3 py-1.5 text-xs text-white whitespace-nowrap z-10 pointer-events-none">
                      Min: {data.min.toLocaleString()} | Q1: {data.q1.toLocaleString()} | Median: {data.median.toLocaleString()} | Q3: {data.q3.toLocaleString()} | Max: {data.max.toLocaleString()}
                    </div>
                  </div>
                )
              })}
              
              {/* X Axis Labels */}
              <div className="flex justify-between w-full mt-4 text-xs text-muted-foreground border-t border-white/10 pt-2">
                <span>0</span>
                <span>40k</span>
                <span>80k</span>
                <span>120k</span>
                <span>160k</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
