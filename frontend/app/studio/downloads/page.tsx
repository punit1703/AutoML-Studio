"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { 
  Download, 
  FileJson, 
  FileText, 
  Package, 
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Terminal,
  FileCode2,
  HardDriveDownload
} from "lucide-react";

type ExportType = "notebook" | "pdf" | "model" | "charts";

interface DownloadItem {
  id: ExportType;
  title: string;
  description: string;
  icon: React.ElementType;
  format: string;
  size: string;
  color: string;
  bg: string;
}

const downloadItems: DownloadItem[] = [
  {
    id: "notebook",
    title: "Jupyter Notebook",
    description: "Export the entire AutoML pipeline including data preprocessing, feature engineering, and model training code.",
    icon: Terminal,
    format: ".ipynb",
    size: "45 KB",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    id: "pdf",
    title: "Analysis & Evaluation Report",
    description: "A comprehensive PDF document containing all dataset statistics, distribution charts, and model performance metrics.",
    icon: FileText,
    format: ".pdf",
    size: "2.4 MB",
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  {
    id: "model",
    title: "Trained Model Pipeline",
    description: "Serialized winning model along with the preprocessing transformers, ready for production deployment.",
    icon: Package,
    format: ".pkl",
    size: "14.8 MB",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    id: "charts",
    title: "Diagnostic Charts",
    description: "High-resolution PNG exports of all diagnostic charts including ROC curves and Confusion Matrices.",
    icon: ImageIcon,
    format: ".zip",
    size: "4.2 MB",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DownloadsPage() {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<{ id: string; title: string; description: string }[]>([]);

  const handleDownload = (item: DownloadItem) => {
    // Set downloading state
    setDownloading(prev => ({ ...prev, [item.id]: true }));

    // Simulate download delay
    setTimeout(() => {
      setDownloading(prev => ({ ...prev, [item.id]: false }));
      
      // Add success toast
      const toastId = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, {
        id: toastId,
        title: "Download Complete",
        description: `Successfully downloaded ${item.title} (${item.format}).`
      }]);

      // Remove toast after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 3000);
    }, 1500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20 relative min-h-[80vh]">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <HardDriveDownload className="w-6 h-6 text-primary" />
            </div>
            Export & Downloads
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Export your trained models, code, and analytical reports to integrate with your external production environments.
          </p>
        </div>
      </motion.div>

      {/* Downloads Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {downloadItems.map((item) => {
          const Icon = item.icon;
          const isDownloading = downloading[item.id];
          
          return (
            <motion.div key={item.id} variants={itemVariants}>
              <Card className="bg-[#09090b] border-white/10 h-full hover:border-primary/50 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl border border-white/10 ${item.bg}`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-white font-medium bg-white/5 px-2 py-1 rounded-md border border-white/10">
                        {item.format}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">{item.size}</div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <Button 
                      onClick={() => handleDownload(item)} 
                      disabled={isDownloading}
                      className={`w-full font-medium ${isDownloading ? 'bg-primary/50 cursor-not-allowed' : 'bg-white/10 hover:bg-primary text-white hover:text-black border border-white/10 hover:border-primary shadow-[0_0_15px_rgba(56,189,248,0)] hover:shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all'}`}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing File...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              title={toast.title}
              description={toast.description}
              variant="success"
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
