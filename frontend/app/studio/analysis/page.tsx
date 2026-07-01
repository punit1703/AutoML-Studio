"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  TableProperties, 
  FileWarning, 
  Copy, 
  Target,
  BarChart3,
  PieChart,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from "recharts";

// Mock Data
const summaryMetrics = [
  { title: "Rows", value: "10,000", icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Columns", value: "14", icon: TableProperties, color: "text-purple-500", bg: "bg-purple-500/10" },
  { title: "Missing Values", value: "42 (0.03%)", icon: FileWarning, color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Duplicates", value: "5 (0.05%)", icon: Copy, color: "text-rose-500", bg: "bg-rose-500/10" },
  { title: "Problem Type", value: "Classification", icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const distributionData = [
  { name: "0-20", count: 400 },
  { name: "21-30", count: 3000 },
  { name: "31-40", count: 4500 },
  { name: "41-50", count: 1200 },
  { name: "51-60", count: 600 },
  { name: "60+", count: 300 },
];

const missingValuesData = [
  { name: "Age", missing: 12 },
  { name: "Income", missing: 25 },
  { name: "Credit_Score", missing: 5 },
  { name: "Dependents", missing: 0 },
  { name: "Balance", missing: 0 },
];

const dataTypesData = [
  { column: "CustomerID", type: "Categorical (ID)", count: 10000, unique: 10000 },
  { column: "Age", type: "Numerical (Int)", count: 9988, unique: 62 },
  { column: "Income", type: "Numerical (Float)", count: 9975, unique: 4500 },
  { column: "Geography", type: "Categorical (Nominal)", count: 10000, unique: 3 },
  { column: "IsActiveMember", type: "Boolean", count: 10000, unique: 2 },
  { column: "Churn", type: "Boolean (Target)", count: 10000, unique: 2 },
];

const statisticsData = [
  { column: "Age", mean: "38.92", median: "37.00", min: "18", max: "92", stdDev: "10.48" },
  { column: "Income", mean: "$100,090", median: "$100,193", min: "$11.58", max: "$199,992", stdDev: "$31,970" },
  { column: "Credit_Score", mean: "650.52", median: "652.00", min: "350", max: "850", stdDev: "96.65" },
  { column: "Balance", mean: "$76,485", median: "$97,198", min: "$0.00", max: "$250,898", stdDev: "$62,397" },
];

const targetSuggestionsData = [
  { column: "Churn", task: "Binary Classification", confidence: "98%" },
  { column: "Income", task: "Regression", confidence: "75%" },
  { column: "Geography", task: "Multi-class Classification", confidence: "45%" },
];

export default function DatasetAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "statistics" | "suggestions">("overview");

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Feature Distribution
                </CardTitle>
                <CardDescription>Age distribution across the dataset</CardDescription>
              </div>
              <select className="bg-black/50 border border-white/10 rounded-md text-sm p-1.5 text-white outline-none focus:ring-1 focus:ring-primary">
                <option>Age</option>
                <option>Income</option>
                <option>Credit_Score</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-amber-500" />
              Missing Values Analysis
            </CardTitle>
            <CardDescription>Features with null or missing entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missingValuesData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                  />
                  <Bar dataKey="missing" radius={[0, 4, 4, 0]}>
                    {missingValuesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.missing > 0 ? '#f59e0b' : '#3f3f46'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Types Table */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-purple-500" />
            Data Types & Schema
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Column Name</th>
                <th className="px-6 py-4 font-medium">Data Type</th>
                <th className="px-6 py-4 font-medium">Valid Count</th>
                <th className="px-6 py-4 font-medium">Unique Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dataTypesData.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    {row.column === "Churn" && <Target className="w-4 h-4 text-emerald-500" />}
                    {row.column}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.type.includes('Target') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      row.type.includes('Numerical') ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      row.type.includes('Categorical') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{row.count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.unique.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderStatistics = () => (
    <Card className="bg-white/5 border-white/10 overflow-hidden">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-500" />
          Numerical Statistics
        </CardTitle>
        <CardDescription>Detailed statistical summary for numerical columns</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-white/5">
            <tr>
              <th className="px-6 py-4 font-medium">Column Name</th>
              <th className="px-6 py-4 font-medium">Mean</th>
              <th className="px-6 py-4 font-medium">Median</th>
              <th className="px-6 py-4 font-medium">Min</th>
              <th className="px-6 py-4 font-medium">Max</th>
              <th className="px-6 py-4 font-medium">Std Dev</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {statisticsData.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{row.column}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.mean}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.median}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.min}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.max}</td>
                <td className="px-6 py-4 text-muted-foreground">{row.stdDev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderSuggestions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targetSuggestionsData.map((sug, i) => (
          <Card key={i} className="bg-white/5 border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground mb-1">Confidence</span>
                <span className="text-lg font-bold text-primary">{sug.confidence}</span>
              </div>
            </div>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 text-primary">
                <Lightbulb className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">{sug.column}</CardTitle>
              <CardDescription>Suggested Target Variable</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-black/40 rounded-md p-3 border border-white/5">
                  <p className="text-xs text-muted-foreground mb-1">Problem Type</p>
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    {sug.task}
                  </p>
                </div>
                <Button 
                  variant={i === 0 ? "default" : "outline"} 
                  className={i === 0 ? "w-full shadow-[0_0_15px_rgba(56,189,248,0.3)]" : "w-full border-white/10 text-white hover:bg-white/10"}
                >
                  {i === 0 ? "Select as Target" : "Set as Target"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <CardHeader className="border-b border-white/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Target Suggestions Overview
          </CardTitle>
          <CardDescription>Tabular view of all suggested target variables and their associated problem types</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-white/5">
              <tr>
                <th className="px-6 py-4 font-medium">Column Name</th>
                <th className="px-6 py-4 font-medium">Suggested Task</th>
                <th className="px-6 py-4 font-medium">Confidence Score</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {targetSuggestionsData.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{row.column}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span className="text-muted-foreground">{row.task}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-black/50 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: row.confidence }}
                        ></div>
                      </div>
                      <span className="text-muted-foreground">{row.confidence}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                      Select
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            Dataset Analysis
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Comprehensive profiling of your dataset to understand its structure, quality, and potential modeling strategies before training.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
            Export Report
          </Button>
          <Button className="shadow-[0_0_15px_rgba(56,189,248,0.4)]">
            Continue to Cleaning
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryMetrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-default h-full">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
                  <div className={`p-3 rounded-full ${metric.bg} ${metric.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{metric.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        {[
          { id: "overview", label: "Overview & Charts", icon: PieChart },
          { id: "statistics", label: "Descriptive Statistics", icon: TableProperties },
          { id: "suggestions", label: "Target Suggestions", icon: Target },
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
                  layoutId="activeTab"
                  className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px]"
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "statistics" && renderStatistics()}
        {activeTab === "suggestions" && renderSuggestions()}
      </motion.div>
    </div>
  );
}
