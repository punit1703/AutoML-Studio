"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Package, 
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Terminal,
  HardDriveDownload
} from "lucide-react";
import api from "@/lib/api";
import { useAppContext } from "@/context/AppContext";

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
    size: "Dynamic",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    id: "pdf",
    title: "Analysis & Evaluation Report",
    description: "A comprehensive PDF document containing all dataset statistics, distribution charts, and model performance metrics.",
    icon: FileText,
    format: ".pdf",
    size: "Dynamic",
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  {
    id: "model",
    title: "Trained Model Pipeline",
    description: "Serialized winning model along with the preprocessing transformers, ready for production deployment.",
    icon: Package,
    format: ".pkl",
    size: "Dynamic",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
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
  const { datasetId } = useAppContext();
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<{ id: string; title: string; description: string }[]>([]);
  
  const [targetColumn, setTargetColumn] = useState("");
  const [bestModel, setBestModel] = useState("");

  useEffect(() => {
    if (datasetId) {
      api.get(`v1/datasets/${datasetId}/analyze/`).then(res => {
        const numCols = res.data.numerical_columns || [];
        const catCols = res.data.categorical_columns || [];
        const allCols = [...numCols, ...catCols];
        
        let target = "";
        const suggested = res.data.suggested_targets || [];
        if (suggested.length > 0) {
          target = suggested[0];
        } else if (allCols.length > 0) {
          target = allCols[allCols.length - 1];
        }
        setTargetColumn(target);
        
        if (target) {
          api.post(`v1/datasets/${datasetId}/evaluate/`, { target_column: target }).then(evalRes => {
             setBestModel(evalRes.data.best_model || "");
          }).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [datasetId]);

  const handleDownload = async (item: DownloadItem) => {
    if (!datasetId) {
      alert("No dataset selected");
      return;
    }
    
    setDownloading(prev => ({ ...prev, [item.id]: true }));

    try {
      if (item.id === "notebook") {
        await api.post(`v1/datasets/${datasetId}/generate_notebook/`, { target_column: targetColumn || "target" });
        window.open(`http://localhost:8000/api/v1/datasets/${datasetId}/download_notebook/`, "_blank");
      } else if (item.id === "pdf") {
        await api.post(`v1/datasets/${datasetId}/generate_report/`, { target_column: targetColumn || "target" });
        window.open(`http://localhost:8000/api/v1/datasets/${datasetId}/download_report/`, "_blank");
      } else if (item.id === "model") {
        const modelName = bestModel || "Unknown";
        window.open(`http://localhost:8000/api/v1/datasets/${datasetId}/download_model/?model_name=${modelName}`, "_blank");
      }
      
      const toastId = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, {
        id: toastId,
        title: "Download Started",
        description: `Successfully initiated download for ${item.title}.`
      }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 3000);
      
    } catch (err) {
      console.error(err);
      alert("Download failed. Check console for details.");
    } finally {
      setDownloading(prev => ({ ...prev, [item.id]: false }));
    }
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
              <Card className="bg-[#09090b] border-white/10 h-full flex flex-col hover:border-white/20 transition-colors">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-white/5 rounded text-muted-foreground">
                      {item.format}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-6">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <span className="text-xs text-muted-foreground">{item.size}</span>
                    <Button 
                      onClick={() => handleDownload(item)}
                      disabled={isDownloading || !datasetId}
                      className={`min-w-[120px] shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing...
                        </>
                      ) : (
                        <>
                          Download <HardDriveDownload className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="bg-black border border-white/10 p-4 rounded-lg shadow-xl w-80 pointer-events-auto flex items-start gap-3"
            >
              <div className="mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-white"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
