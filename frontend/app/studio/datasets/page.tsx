"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Database, Search, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

export default function DatasetsPage() {
  const router = useRouter();
  const { setDatasetId } = useAppContext();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("v1/datasets/")
      .then(res => setDatasets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openDataset = (id: string) => {
    setDatasetId(id);
    router.push(`/studio/datasets/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono">Datasets</h1>
          <p className="text-muted-foreground">Manage data sources across all your projects.</p>
        </div>
        <button
          onClick={() => router.push("/studio/upload")}
          className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.4)]"
        >
          Add Dataset
        </button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : datasets.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-dashed border-border flex flex-col items-center">
              <Database className="w-12 h-12 mb-4 opacity-20" />
              <p>No datasets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {datasets.map(dataset => (
                <div key={dataset.id} onClick={() => openDataset(dataset.id)} className="p-6 flex items-center justify-between hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground group-hover:text-primary" /> {dataset.file_name}
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="bg-secondary px-2 py-1 rounded">Size: {(dataset.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                      <span className="bg-secondary px-2 py-1 rounded">Rows: {dataset.row_count || 'Unknown'}</span>
                      <span className="bg-secondary px-2 py-1 rounded">Project: {dataset.project_title || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="text-primary font-medium text-sm flex items-center gap-1 hover:underline">
                      View Profile <Search className="w-4 h-4" />
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
