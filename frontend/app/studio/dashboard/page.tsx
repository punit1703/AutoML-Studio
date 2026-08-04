"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Cpu, Activity, Clock, Loader2, Play, FolderOpen } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function DashboardPage() {
  const router = useRouter();
  const { setProjectId, setDatasetId } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
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
    
    const fetchProjects = async () => {
      try {
        const response = await api.get("v1/projects/");
        setProjects(response.data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };

    fetchStats();
    fetchProjects();
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
      router.push("/studio/pipeline");
    } else {
      router.push("/studio/upload");
    }
  };

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
        <button
          onClick={() => {
            setProjectId(null);
            setDatasetId(null);
            router.push("/studio/upload");
          }}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
        >
          <Play className="w-4 h-4 mr-2" />
          New Project
        </button>
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
              <Card className="bg-card border-border hover:border-primary/50 transition-colors shadow-sm overflow-hidden relative group h-full">
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

      {/* Saved Projects Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Saved Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-secondary/50">
                <Database className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No saved projects found.</p>
                <p className="text-xs mt-1">Complete a training pipeline and save it to see it here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project: any) => (
                  <div 
                    key={project.id}
                    className="p-4 rounded-xl border border-border bg-secondary hover:border-primary/50 transition-all cursor-pointer group flex flex-col"
                    onClick={() => resumeProject(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground truncate pr-2">{project.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap bg-secondary px-2 py-1 rounded">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {project.description || "No description provided."}
                    </p>
                    <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Resume Workspace <Play className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
