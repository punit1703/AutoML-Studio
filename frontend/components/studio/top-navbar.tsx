"use client";

import * as React from "react";
import { useState } from "react";
import { Search, User, Moon, Code2, Save, X, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/context/AppContext";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

import { ThemeToggle } from "@/components/theme-toggle";

export function StudioTopNavbar() {
  const { projectId, setProjectId, datasetId, setDatasetId } = useAppContext();
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("My AutoML Project");
  const [saving, setSaving] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Close profile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileMenu]);

  React.useEffect(() => {
    if (projectId) {
      api.get(`v1/projects/${projectId}/`).then((res) => {
        setProjectName(res.data.title || "My AutoML Project");
      }).catch((err) => {
        console.error(err);
        if (err.response?.status === 404) {
          setProjectId(null);
          setDatasetId(null);
        }
      });

      api.get(`v1/datasets/?project_id=${projectId}`).then((res) => {
        setDatasets(res.data);
      }).catch(console.error);
    }
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await api.post(`v1/projects/${projectId}/save_project/`, { title: projectName });
      setShowModal(false);
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  };

  return (
    <>
      <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          {/* Project Name (Editable style) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-secondary cursor-pointer transition-colors group">
            <Code2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-semibold text-foreground">
              {projectName}
            </span>
          </div>

          {/* Dataset Switcher Removed */}
        </div>

        <div className="flex items-center gap-4 flex-1 justify-center max-w-md">
          {/* Search Bar Removed */}
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {projectId && (
            <>
              <button
                onClick={() => {
                  setProjectId(null);
                  setDatasetId(null);
                  window.location.href = "/studio/upload";
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-secondary border border-border hover:bg-muted transition-colors"
              >
                New Project
              </button>
              <button 
                onClick={() => {
                  if (!recentlySaved) setShowModal(true);
                }}
                disabled={recentlySaved}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  recentlySaved 
                    ? "bg-success/10 text-success border border-success/20 cursor-default" 
                    : "bg-primary text-background hover:bg-primary/90 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                }`}
              >
                {recentlySaved ? (
                  <><CheckCircle2 className="w-4 h-4" /> Saved</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Project</>
                )}
              </button>
            </>
          )}

          <ThemeToggle />
          
          {/* Profile Avatar & Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
              className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:shadow-[0_0_10px_rgba(56,189,248,0.3)] transition-all"
            >
              <User className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-border/50">
                    <p className="text-sm font-medium text-foreground">My Account</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Save Project Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/50">
                <h2 className="text-lg font-semibold text-foreground">Save Project</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Project Name
                  </label>
                  <Input 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="E.g., Customer Churn Prediction"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/50 h-10"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Saving this project will make it available on your dashboard for future reference.
                  </p>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-secondary border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving || !projectName.trim()}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-background hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.4)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Project
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
