"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

export function HeroSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("relative pt-36 pb-24 md:pt-52 md:pb-40 overflow-hidden", className)}>
      
      {/* Animated Background Mesh/Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-blue-400/20 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
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
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Introducing AutoML Studio
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.05]">
              Build ML Models <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary via-blue-500 to-indigo-400">
                Without Code.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="mt-6 text-lg md:text-xl text-muted-foreground font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Upload your data. Train multiple algorithms. Compare performance instantly. Download the best model in seconds.
            </motion.p>
            
            <motion.div variants={fadeIn} className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 h-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all border border-primary/50 group relative overflow-hidden">
                <span className="relative z-10 font-semibold tracking-wide">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-14 rounded-full border-border/50 hover:bg-muted/50 transition-all font-medium">
                View Documentation
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Hero Illustration / Floating Cards (Glassmorphism) */}
        <div className="relative h-[400px] md:h-[500px] w-full hidden lg:block z-10">
          
          <FloatingCard 
            delay={0}
            className="top-10 right-10 w-72 bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-white/40 dark:border-white/10 shadow-2xl shadow-black/5"
          >
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider">Random Forest</div>
                <div className="text-success text-xs font-bold px-2 py-1 bg-success/10 rounded-full border border-success/20">94.2% Acc</div>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-success/80 to-success w-[94.2%]" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard 
            delay={1.5}
            className="top-48 left-0 w-80 bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-white/40 dark:border-white/10 shadow-2xl shadow-black/5 z-20"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">CSV</div>
                <div>
                  <div className="text-sm font-bold text-foreground">customer_churn_24.csv</div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">1.2M rows • 14 features</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 flex-[3] bg-primary rounded-full shadow-sm" />
                <div className="h-1.5 flex-[1] bg-primary/40 rounded-full" />
                <div className="h-1.5 flex-[1] bg-primary/20 rounded-full" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard 
            delay={3}
            className="bottom-10 right-20 w-64 bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-white/40 dark:border-white/10 shadow-2xl shadow-black/5"
          >
            <div className="p-4 flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-warning/20 border-t-warning animate-spin" />
                <div className="absolute w-2 h-2 rounded-full bg-warning" />
              </div>
              <div>
                <div className="text-sm font-bold">Training XGBoost...</div>
                <div className="text-xs text-muted-foreground font-medium mt-0.5">Epoch 42/100</div>
              </div>
            </div>
          </FloatingCard>
          
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: [0, -20, 0],
        scale: 1
      }}
      transition={{ 
        opacity: { duration: 0.8, delay: delay * 0.2 },
        scale: { duration: 0.8, delay: delay * 0.2 },
        y: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.5,
        }
      }}
      className={cn("absolute rounded-2xl border", className)}
    >
      {children}
    </motion.div>
  );
}
