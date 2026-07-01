"use client";

import * as React from "react";
import { TerminalSquare, X, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StudioOutputPanel() {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <div className="border-t border-white/10 bg-[#09090b] flex flex-col shrink-0">
      {/* Panel Header */}
      <div 
        className="h-9 flex items-center justify-between px-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
          <TerminalSquare className="w-4 h-4 text-primary" />
          Output Terminal
        </div>
        <div className="flex items-center gap-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-white/10">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button className="text-muted-foreground hover:text-error transition-colors p-1 rounded hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: "200px" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="overflow-y-auto bg-[#000000] p-4 font-mono text-xs shadow-inner"
          >
            <div className="space-y-2">
              <div className="text-muted-foreground">AutoML Studio Initialized.</div>
              <div className="flex gap-2">
                <span className="text-primary">❯</span>
                <span className="text-foreground">Waiting for dataset upload...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
