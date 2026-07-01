"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileType, CheckCircle2, Loader2, Table as TableIcon, ArrowRight, Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "preview";

export default function DatasetUploadPage() {
  const [uploadState, setUploadState] = React.useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [fileDetails, setFileDetails] = React.useState<{ name: string; size: string } | null>(null);

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
      processFile(files[0]);
    } else {
      setUploadState("idle");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    // Format size
    const size = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    setFileDetails({ name: file.name, size });
    simulateUpload();
  };

  const simulateUpload = () => {
    setUploadState("uploading");
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState("success");
          setTimeout(() => setUploadState("preview"), 1500);
          return 100;
        }
        return prev + 5; // Simulate chunk upload
      });
    }, 100);
  };

  const resetUpload = () => {
    setUploadState("idle");
    setUploadProgress(0);
    setFileDetails(null);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
          $ dataset upload
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ingest raw data into your workspace for cleaning and model training.
        </p>
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
                  : "border-white/20 bg-[#09090b] hover:border-white/40 hover:bg-[#0c0c0e]"
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
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                    <UploadCloud className={`w-8 h-8 ${uploadState === "dragging" ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Drag & drop your dataset here</h3>
                  <p className="text-muted-foreground mb-8 max-w-sm">
                    Supports CSV, JSON, and Parquet files up to 5GB.
                  </p>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileSelect}
                      accept=".csv,.json,.parquet"
                    />
                    <button className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]">
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

                  <h3 className="text-xl font-bold text-white mb-2 font-mono">
                    {uploadState === "uploading" ? "Uploading Dataset..." : "Upload Complete"}
                  </h3>
                  <p className="text-muted-foreground mb-8 font-mono text-sm">
                    {fileDetails?.name} <span className="opacity-50">({fileDetails?.size})</span>
                  </p>
                  
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
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
            <Card className="bg-[#09090b] border-white/10">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <TableIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white font-mono">{fileDetails?.name || "dataset.csv"}</h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono mt-1">
                      <span>{fileDetails?.size || "2.4 MB"}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validated</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetUpload} className="px-4 py-2 rounded-md bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
                    Upload Different File
                  </button>
                  <button className="px-4 py-2 rounded-md bg-primary text-black font-semibold text-sm hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] flex items-center gap-2">
                    Start Analysis <Play className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Data Preview Table */}
            <Card className="bg-[#09090b] border-white/10 overflow-hidden">
              <CardHeader className="border-b border-white/10 bg-white/[0.02]">
                <CardTitle className="text-base flex items-center gap-2">
                  Data Preview <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded bg-white/5 border border-white/10">First 5 rows</span>
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/[0.02] border-b border-white/10 font-mono">
                    <tr>
                      <th className="px-6 py-3 font-medium">customerID</th>
                      <th className="px-6 py-3 font-medium">gender</th>
                      <th className="px-6 py-3 font-medium">tenure</th>
                      <th className="px-6 py-3 font-medium">MonthlyCharges</th>
                      <th className="px-6 py-3 font-medium">TotalCharges</th>
                      <th className="px-6 py-3 font-medium">Churn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-muted-foreground">
                    {[
                      ["7590-VHVEG", "Female", "1", "29.85", "29.85", "No"],
                      ["5575-GNVDE", "Male", "34", "56.95", "1889.5", "No"],
                      ["3668-QPYBK", "Male", "2", "53.85", "108.15", "Yes"],
                      ["7795-CFOCW", "Male", "45", "42.3", "1840.75", "No"],
                      ["9237-HQITU", "Female", "2", "70.7", "151.65", "Yes"],
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className={`px-6 py-4 ${j === 5 ? (cell === "Yes" ? "text-error" : "text-success") : "text-white"}`}>
                            {cell}
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
    </div>
  );
}
