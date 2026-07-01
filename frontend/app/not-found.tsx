"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Home, ChevronRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 24 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="absolute left-1/2 -top-12 -translate-x-1/2 w-24 h-24 bg-primary/20 rounded-full blur-2xl"
          />
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/20 tracking-tighter relative z-10">
            404
          </h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
            <Search className="w-6 h-6 text-primary" />
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-sm">
            We searched high and low across the model registry, but the page you are looking for does not exist or has been moved.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pt-4"
        >
          <Link 
            href="/studio/dashboard"
            className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-medium text-black bg-white rounded-lg hover:bg-primary hover:text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] group"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
