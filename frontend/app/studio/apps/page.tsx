"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Globe, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function AppsPage() {
  const router = useRouter();
  const { projectId } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [deployments, setDeployments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        const response = await api.get("v1/deployments/");
        // Filter deployments for the current project if we are in a project context
        // Or show all if not
        let data = response.data;
        if (projectId) {
          data = data.filter((d: any) => d.project === projectId);
        }
        setDeployments(data);
      } catch (error) {
        console.error("Failed to fetch deployments", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeployments();
  }, [projectId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
          $ prediction apps
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Access and share your deployed machine learning models.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Active Deployments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-50 text-primary" />
                <p>Loading deployments...</p>
              </div>
            ) : deployments.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-secondary/50">
                <Globe className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No prediction apps available.</p>
                <p className="text-xs mt-1">Complete a training pipeline to deploy a model.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deployments.map((dep: any) => (
                  <div 
                    key={dep.id}
                    className="p-5 rounded-xl border border-border bg-secondary hover:border-primary/50 transition-all cursor-pointer group flex flex-col"
                    onClick={() => router.push(`/predict/${dep.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground truncate pr-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
                        {dep.model_name || "Prediction App"}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap bg-background border border-border px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      Predicting target: <strong className="text-foreground">{dep.target_column}</strong>
                    </p>
                    <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Application <ArrowRight className="w-3 h-3 ml-1" />
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
