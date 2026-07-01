"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Cpu, Activity, Clock } from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "Total Models", value: "12", icon: Cpu, trend: "+2 this week" },
    { title: "Active Datasets", value: "5", icon: Database, trend: "3.2 GB total" },
    { title: "Compute Time", value: "24.5h", icon: Clock, trend: "4h remaining" },
    { title: "System Status", value: "Healthy", icon: Activity, trend: "All clusters online" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
            $ dashboard stats
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of your current workspace and model performance.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="bg-[#09090b] border-white/10 hover:border-primary/50 transition-colors shadow-sm overflow-hidden relative group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="bg-[#09090b] border-white/10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Training Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-lg bg-[#000000]">
              <Database className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">No recent activity detected.</p>
              <p className="text-xs mt-1">Upload a dataset to start training.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
