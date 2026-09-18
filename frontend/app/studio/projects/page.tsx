"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FolderOpen, Play, Loader2, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function ProjectsPage() {
  const router = useRouter();
  const { setProjectId, setDatasetId } = useAppContext();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("v1/projects/")
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const deleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`v1/projects/${projectId}/`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Projects</h1>
          <p className="text-muted-foreground">Manage your ML project workspaces.</p>
        </div>
        <button
          onClick={() => {
            setProjectId(null);
            setDatasetId(null);
            router.push("/studio/upload");
          }}
          className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.4)]"
        >
          New Project
        </button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-dashed border-border flex flex-col items-center">
              <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>No projects found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map(project => (
                <div key={project.id} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground cursor-pointer group-hover:text-primary transition-colors" onClick={() => resumeProject(project)}>{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.description || "No description."}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="bg-secondary px-2 py-1 rounded">Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      <span className="bg-secondary px-2 py-1 rounded">Status: {project.latest_deployment_id ? 'Completed' : 'Draft'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => resumeProject(project)} className="text-primary font-medium text-sm flex items-center gap-1 hover:underline">
                      Open <Play className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => deleteProject(e, project.id)} className="text-muted-foreground hover:text-destructive p-2 rounded hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
