"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Cpu, Activity, Clock, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: "Total Models", value: "0", icon: Cpu, trend: "Trained models" },
    { title: "Active Datasets", value: "0", icon: Database, trend: "0 KB total" },
    { title: "Compute Time", value: "0h", icon: Clock, trend: "Used resources" },
    { title: "System Status", value: "Checking...", icon: Activity, trend: "Pinging clusters" },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("v1/projects/dashboard_stats/");
        const data = response.data;
        setStats([
          { title: "Total Models", value: data.total_models.toString(), icon: Cpu, trend: "Trained models" },
          { title: "Active Datasets", value: data.active_datasets.toString(), icon: Database, trend: data.total_size_str },
          { title: "Compute Time", value: data.compute_time, icon: Clock, trend: "Used resources" },
          { title: "System Status", value: data.system_status, icon: Activity, trend: "All clusters online" },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setStats([
          { title: "Total Models", value: "Error", icon: Cpu, trend: "Trained models" },
          { title: "Active Datasets", value: "Error", icon: Database, trend: "0 KB total" },
          { title: "Compute Time", value: "Error", icon: Clock, trend: "Used resources" },
          { title: "System Status", value: "Offline", icon: Activity, trend: "Cannot reach server" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
              <Card className="bg-[#09090b] border-white/10 hover:border-primary/50 transition-colors shadow-sm overflow-hidden relative group h-full">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center text-muted-foreground pt-1">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold font-mono">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {stat.trend}
                      </p>
                    </>
                  )}
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
