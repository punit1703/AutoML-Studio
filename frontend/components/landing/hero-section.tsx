"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";
import { Terminal, Code2, Cpu } from "lucide-react";

export function HeroSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("relative pt-36 pb-24 md:pt-52 md:pb-40 overflow-hidden bg-background", className)}>
      
      {/* Dark Mode Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Deep Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-primary/20 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-accent/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Text Content */}
        <div className="space-y-8 text-center lg:text-left relative z-20">
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-primary text-xs font-mono uppercase tracking-wider backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse" />
              v2.0 Beta Live
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.05]">
              Train ML Models <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-accent to-primary-light">
                At Light Speed.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="mt-6 text-lg md:text-xl text-muted-foreground font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              The ultimate AutoML infrastructure for developers. Upload datasets, run parallel training across dozens of algorithms, and deploy instantly.
            </motion.p>
            
            <motion.div variants={fadeIn} className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button className="inline-flex items-center justify-center w-full sm:w-auto text-base px-8 h-14 rounded-md bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_30px_rgba(56,189,248,0.6)] hover:-translate-y-0.5 transition-all font-mono font-semibold">
                <Terminal className="w-4 h-4 mr-2" />
                Start Training
              </button>
              <button className="inline-flex items-center justify-center w-full sm:w-auto text-base px-8 h-14 rounded-md border border-white/20 text-foreground hover:bg-white/10 hover:border-white/30 transition-all font-mono font-medium">
                <Code2 className="w-4 h-4 mr-2" />
                Read Docs
              </button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Terminal / IDE Mockup */}
        <div className="relative w-full hidden lg:block z-10">
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative rounded-xl bg-[#09090b] border border-white/10 shadow-2xl shadow-black/80 overflow-hidden"
            style={{ perspective: 1000 }}
          >
            {/* Terminal Header */}
            <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#18181b]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto text-xs font-mono text-muted-foreground flex items-center gap-2">
                <Cpu className="w-3 h-3" />
                automl-cluster-us-east
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 font-mono text-sm space-y-4">
              <div className="flex gap-4">
                <span className="text-primary">❯</span>
                <span className="text-foreground">import automl_studio as aml</span>
              </div>
              <div className="flex gap-4">
                <span className="text-primary">❯</span>
                <span className="text-foreground">dataset = aml.load("transactions.csv")</span>
              </div>
              <div className="flex gap-4">
                <span className="text-primary">❯</span>
                <span className="text-foreground">model = aml.train(dataset, target="fraud")</span>
              </div>
              
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="text-muted-foreground">Initializing parallel training pool (12 workers)...</div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-accent">XGBoost [gpu:0]</span>
                    <span className="text-success">98.4%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "98.4%" }}
                      transition={{ duration: 2, delay: 0.5, ease: "circOut" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-accent">Random Forest [cpu:1]</span>
                    <span className="text-muted-foreground">94.1%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white/30 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "94.1%" }}
                      transition={{ duration: 2.5, delay: 0.2, ease: "circOut" }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-accent">LightGBM [gpu:1]</span>
                    <span className="text-primary animate-pulse">Training...</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute top-0 bottom-0 left-0 bg-primary/50 rounded-full w-1/3"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Subtle Glow Behind Terminal */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/20 blur-[100px] rounded-full -z-10" />
        </div>
      </div>
    </section>
  );
}
