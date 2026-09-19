"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileType, CheckCircle2, Loader2, Table as TableIcon, ArrowRight, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "preview";

export default function DatasetUploadPage() {
  const router = useRouter();
  const { projectId, setProjectId, datasetId, setDatasetId } = useAppContext();
  const [uploadState, setUploadState] = React.useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [fileDetails, setFileDetails] = React.useState<{ name: string; size: string } | null>(null);
  const [previewColumns, setPreviewColumns] = React.useState<string[]>([]);
  const [previewData, setPreviewData] = React.useState<any[]>([]);

  const [relationRecommendation, setRelationRecommendation] = React.useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "idle") setUploadState("dragging");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "dragging") setUploadState("idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(Array.from(files));
    } else {
      setUploadState("idle");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  };

  const processFiles = async (files: File[]) => {
    // Phase 1: Only allow CSV files
    const csvFiles = files.filter(f => f.name.toLowerCase().endsWith('.csv'));
    
    if (csvFiles.length === 0) {
        alert("Only CSV files are supported for this version.");
        setUploadState("idle");
        return;
    }
    
    const validFiles = csvFiles;

    if (validFiles.length === 1) {
      const size = (validFiles[0].size / (1024 * 1024)).toFixed(2) + " MB";
      setFileDetails({ name: validFiles[0].name, size });
    } else {
      setFileDetails({ name: `${validFiles.length} files selected`, size: "Multi-file upload" });
    }
    
    setUploadState("uploading");
    setUploadProgress(10);

    try {
      let currentProjectId = projectId;
      
      if (!currentProjectId) {
        const projRes = await api.post('v1/projects/', {
          title: "Default AutoML Project",
          description: "Auto-generated project"
        });
        currentProjectId = projRes.data.id;
        setProjectId(currentProjectId);
      }
      
      setUploadProgress(30);

      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('project_id', currentProjectId!);
      
      const uploadRes = await api.post('v1/datasets/upload_multiple/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(30 + (percentCompleted * 0.6));
        }
      });
      
      setUploadProgress(100);
      
      if (uploadRes.data.status === "requires_action") {
        setRelationRecommendation(uploadRes.data);
        setUploadState("idle");
        // We will show a modal instead of going to preview
        return;
      }
      
      // Success or merged
      const newDatasetId = uploadRes.data.dataset_id;
      setDatasetId(newDatasetId);
      setUploadState("success");
      
      // Fetch dataset details for metadata display
      try {
        const dsRes = await api.get(`v1/datasets/${newDatasetId}/`);
        setFileDetails((prev) => ({
            ...prev!,
            row_count: dsRes.data.row_count,
            column_count: dsRes.data.column_count,
            encoding: dsRes.data.detected_encoding || 'UTF-8'
        }));
      } catch (err) {
        console.error("Failed to fetch dataset metadata");
      }
      
      // Fetch preview
      const previewRes = await api.get(`v1/datasets/${newDatasetId}/preview/?rows=5`);
      const preview = previewRes.data.preview;
      if (preview && preview.length > 0) {
        setPreviewColumns(Object.keys(preview[0]));
        setPreviewData(preview);
      }
      
      setTimeout(() => setUploadState("preview"), 1500);
    } catch (error: any) {
      console.error("Upload failed", error);
      setUploadState("idle");
      // Handle DRF validation error gracefully
      const errorMsg = error.response?.data?.error || error.response?.data?.detail || (typeof error.response?.data === 'string' ? error.response?.data : "Upload failed. Please ensure the CSV is valid.");
      alert(`Validation Error: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`);
    }
  };

  const [classSeparatedTargetName, setClassSeparatedTargetName] = React.useState("Dataset_Label");
  const [isMerging, setIsMerging] = React.useState(false);

  const handleRelationAction = (action: string) => {
    alert(`Action selected: ${action}. The platform will execute this relation strategy.`);
    const dsId = relationRecommendation.datasets[0].id;
    setRelationRecommendation(null);
    setDatasetId(dsId);
    router.push(`/studio/datasets/${dsId}`);
  };

  const handleClassSeparatedMerge = async () => {
    setIsMerging(true);
    try {
      const datasetIds = relationRecommendation.datasets.map((d: any) => d.id);
      const classes = relationRecommendation.datasets.map((d: any) => d.class_name);
      
      const res = await api.post('v1/datasets/merge_class_separated/', {
        project_id: projectId,
        dataset_ids: datasetIds,
        classes: classes,
        target_column_name: classSeparatedTargetName
      });
      
      const dsId = res.data.dataset_id;
      setDatasetId(dsId);
      setRelationRecommendation(null);
      router.push(`/studio/datasets/${dsId}`);
    } catch (err: any) {
      alert("Merge failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsMerging(false);
    }
  };

  const handleClassLabelChange = (index: number, value: string) => {
    const updated = { ...relationRecommendation };
    updated.datasets[index].class_name = value;
    setRelationRecommendation(updated);
  };

  const resetUpload = () => {
    setUploadState("idle");
    setUploadProgress(0);
    setFileDetails(null);
    setProjectId(null);
    setDatasetId(null);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
          $ dataset upload
        </h1>
        {projectId ? (
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Adding to Existing Project</p>
              <p className="text-xs text-muted-foreground mt-1">
                You are currently adding a dataset to your active workspace. If you meant to start a new project for this data, click here:
              </p>
            </div>
            <button
              onClick={() => {
                setProjectId(null);
                setDatasetId(null);
              }}
              className="shrink-0 text-xs px-4 py-2 bg-primary text-background rounded hover:bg-primary/90 font-bold shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all"
            >
              Start New Project
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm">
            Ingest raw data into your new workspace for cleaning and model training.
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {(uploadState === "idle" || uploadState === "dragging" || uploadState === "uploading" || uploadState === "success") && (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-12 min-h-[400px] ${
                uploadState === "dragging" 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted"
              }`}
            >
              {/* Animated Background for Dragging */}
              <AnimatePresence>
                {uploadState === "dragging" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {uploadState === "idle" || uploadState === "dragging" ? (
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center mb-6 shadow-inner">
                    <UploadCloud className={`w-8 h-8 ${uploadState === "dragging" ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Drag & drop your dataset here</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    Supports CSV, JSON, and Parquet files up to 5GB.
                  </p>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileSelect}
                      accept=".csv"
                      multiple
                    />
                    <button className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      Browse Files
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
                  <AnimatePresence mode="wait">
                    {uploadState === "uploading" ? (
                      <motion.div 
                        key="uploading-icon"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6"
                      >
                        <FileType className="w-8 h-8 text-primary" />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="success-icon"
                        initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
                        className="w-16 h-16 rounded-full bg-success/20 border border-success flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      >
                        <CheckCircle2 className="w-8 h-8 text-success" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <h3 className="text-xl font-bold text-foreground mb-2 font-mono">
                    {uploadState === "uploading" ? "Uploading Dataset..." : "Upload Complete"}
                  </h3>
                  <p className="text-muted-foreground mb-8 font-mono text-sm">
                    {fileDetails?.name} <span className="opacity-50">({fileDetails?.size})</span>
                  </p>
                  
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${uploadState === "success" ? "bg-success" : "bg-primary"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                  </div>
                  
                  {uploadState === "uploading" && (
                    <div className="w-full flex justify-between mt-2 text-xs font-mono text-muted-foreground">
                      <span>{uploadProgress}%</span>
                      <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing chunks...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {uploadState === "preview" && (
          <motion.div
            key="preview-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* File Info Header */}
            <Card className="bg-card border-border">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <TableIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground font-mono">{fileDetails?.name || "dataset.csv"}</h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono mt-1">
                      <span>{fileDetails?.size || "2.4 MB"}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{((fileDetails as any)?.row_count || 0).toLocaleString()} rows</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{(fileDetails as any)?.column_count || 0} cols</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{(fileDetails as any)?.encoding || "UTF-8"}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validated</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetUpload} className="px-4 py-2 rounded-md bg-secondary border border-border text-sm font-medium hover:bg-muted transition-colors">
                    Upload Different File
                  </button>
                  <button 
                    onClick={() => router.push(`/studio/datasets/${datasetId}`)}
                    className="px-4 py-2 rounded-md bg-primary text-background font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center gap-2"
                  >
                    Continue to Overview <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Data Preview Table */}
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="border-b border-border bg-secondary/50">
                <CardTitle className="text-base flex items-center gap-2">
                  Data Preview <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">First 5 rows</span>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border font-mono">
                    <tr>
                      {previewColumns.map((col, i) => (
                        <th key={i} className="px-6 py-3 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-muted-foreground">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted transition-colors">
                        {previewColumns.map((col, j) => (
                          <td key={j} className="px-6 py-4 text-foreground">
                            {row[col] !== null ? String(row[col]) : "null"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relation Recommendation Modal */}
      <AnimatePresence>
        {relationRecommendation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              
              {relationRecommendation.pattern === 'class_separated' && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Class-Separated Datasets Detected</h2>
                  <p className="text-muted-foreground mb-6">
                    You uploaded multiple files with matching schemas. It looks like each file represents a different category or class.
                    We can automatically merge them and create a target column for your ML model.
                  </p>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">New Target Column Name</label>
                    <input 
                      type="text" 
                      value={classSeparatedTargetName}
                      onChange={(e) => setClassSeparatedTargetName(e.target.value)}
                      className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="space-y-3 mb-8">
                    <label className="block text-sm font-medium">Verify Class Labels</label>
                    {relationRecommendation.datasets.map((ds: any, idx: number) => (
                      <div key={ds.id} className="flex items-center gap-4 bg-muted/50 p-3 rounded-lg border border-border">
                        <span className="font-mono text-sm flex-1 truncate">{ds.name}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input 
                          type="text"
                          value={ds.class_name}
                          onChange={(e) => handleClassLabelChange(idx, e.target.value)}
                          className="w-48 bg-input border border-border rounded px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setRelationRecommendation(null)}
                      className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClassSeparatedMerge}
                      disabled={isMerging}
                      className="px-6 py-2 bg-primary text-background font-bold rounded-lg disabled:opacity-50 flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                    >
                      {isMerging ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Merge & Continue
                    </button>
                  </div>
                </>
              )}

              {relationRecommendation.pattern === 'multi_part' && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Multi-Part Dataset Detected</h2>
                  <p className="text-muted-foreground mb-6">
                    You uploaded multiple files that appear to be parts of the same dataset. 
                    Would you like to combine them into one large dataset before training?
                  </p>

                  <div className="space-y-2 mb-8">
                    {relationRecommendation.datasets.map((ds: any) => (
                      <div key={ds.id} className="font-mono text-sm bg-muted/50 p-2 rounded border border-border">
                        {ds.name}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleRelationAction('Separate Projects')}
                      className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Keep Separate
                    </button>
                    <button
                      onClick={() => handleRelationAction('Merge')}
                      className="px-6 py-2 bg-primary text-background font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                    >
                      Combine Parts
                    </button>
                  </div>
                </>
              )}

              {(relationRecommendation.pattern === 'relational' || relationRecommendation.pattern === 'independent') && (
                <>
                  <h2 className="text-2xl font-bold mb-4">Multiple Datasets Detected</h2>
                  <p className="text-muted-foreground mb-6">
                    You uploaded multiple datasets with different schemas. 
                    {relationRecommendation.pattern === 'relational' && (
                      <span>
                        We found {relationRecommendation.common_columns?.length} common columns: 
                        <span className="font-mono text-primary ml-2">{relationRecommendation.common_columns?.join(', ')}</span>
                      </span>
                    )}
                  </p>
                  
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg mb-8">
                    <p className="text-sm font-semibold text-primary">AI Recommendation</p>
                    <p className="text-lg font-bold text-foreground mt-1">
                      {relationRecommendation.pattern === 'relational' ? 'Recommend Join' : 'Recommend Separate Projects'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => handleRelationAction('Merge')}
                      className="px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center text-center gap-2"
                    >
                      <span className="font-bold">Merge</span>
                      <span className="text-xs text-muted-foreground">Combine into one large table</span>
                    </button>
                    <button
                      onClick={() => handleRelationAction('Join')}
                      className="px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center text-center gap-2"
                    >
                      <span className="font-bold">Join</span>
                      <span className="text-xs text-muted-foreground">Link datasets by common IDs</span>
                    </button>
                    <button
                      onClick={() => handleRelationAction('Separate Projects')}
                      className="px-4 py-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center text-center gap-2"
                    >
                      <span className="font-bold">Separate</span>
                      <span className="text-xs text-muted-foreground">Train independent models</span>
                    </button>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setRelationRecommendation(null)}
                      className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
