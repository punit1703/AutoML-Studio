"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Cpu, Activity, Clock, Loader2, Play, FolderOpen, Trash2, TestTubes, BrainCircuit } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { setProjectId, setDatasetId } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  
  const [stats, setStats] = useState([
    { title: "Total Models", value: "0", icon: Cpu, trend: "" },
    { title: "Active Datasets", value: "0", icon: Database, trend: "0 KB total" },
    { title: "System Status", value: "Checking...", icon: Activity, trend: "" },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, projRes, dsRes, expRes, modRes] = await Promise.all([
          api.get("v1/projects/dashboard_stats/").catch(() => null),
          api.get("v1/projects/").catch(() => ({ data: [] })),
          api.get("v1/datasets/").catch(() => ({ data: [] })),
          api.get("v1/jobs/").catch(() => ({ data: [] })),
          api.get("v1/deployments/").catch(() => ({ data: [] })),
        ]);

        if (statsRes?.data) {
          setStats([
            { title: "Total Models", value: statsRes.data.total_models.toString(), icon: Cpu, trend: "" },
            { title: "Active Datasets", value: statsRes.data.active_datasets.toString(), icon: Database, trend: statsRes.data.total_size_str },
            { title: "System Status", value: statsRes.data.system_status, icon: Activity, trend: "Online" },
          ]);
        }

        setProjects(projRes.data.slice(0, 3));
        setDatasets(dsRes.data.slice(0, 3));
        setExperiments(expRes.data.slice(0, 3));
        setModels(modRes.data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const resumeProject = (project: any) => {
    setProjectId(project.id);
    if (project.primary_dataset_id) {
      setDatasetId(project.primary_dataset_id);
    } else {
      setDatasetId(null);
    }
    
    if (project.latest_deployment_id) {
      router.push("/studio/pipeline");
    } else if (project.primary_dataset_id) {
      router.push("/studio/datasets");
    } else {
      router.push("/studio/upload");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of your workspace, recent experiments, and models.
          </p>
        </div>
        <button
          onClick={() => {
            setProjectId(null);
            setDatasetId(null);
            router.push("/studio/upload");
          }}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
        >
          <Play className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-colors shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground pt-1" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold font-mono">{stat.value}</div>
                      {stat.trend && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {stat.trend}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Training Jobs */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TestTubes className="w-5 h-5 text-primary" />
              Recent Training Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {experiments.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No training jobs run yet.</div>
            ) : (
              experiments.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/50 transition-colors">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{exp.job_type.replace('_', ' ').toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{exp.current_stage || exp.status}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${exp.status === 'COMPLETED' ? 'bg-success/20 text-success' : exp.status === 'FAILED' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                    {exp.status}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Datasets */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Recent Datasets
            </CardTitle>
            <Link href="/studio/datasets" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {datasets.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No datasets uploaded.</div>
            ) : (
              datasets.map(ds => (
                <div key={ds.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div className="overflow-hidden">
                    <div className="font-semibold text-sm text-foreground truncate">{ds.file_name}</div>
                    <div className="text-xs text-muted-foreground">{(ds.file_size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Models */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Generated Models
            </CardTitle>
            <Link href="/studio/models" className="text-sm text-primary hover:underline">View All</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {models.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No models generated yet.</div>
            ) : (
              models.map(mod => (
                <div key={mod.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                  <div>
                    <div className="font-semibold text-sm text-foreground">{mod.model_name}</div>
                    <div className="text-xs text-muted-foreground">Target: {mod.target_column}</div>
                  </div>
                  <div className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    Ready
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
