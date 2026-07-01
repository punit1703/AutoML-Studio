"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, useAnimation, useInView } from "framer-motion";
import { fadeIn, scaleUp } from "@/lib/animations";

export function HeroSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden", className)}>
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Text Content */}
        <div className="space-y-8 text-center lg:text-left">
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.div variants={fadeIn} className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium tracking-wide">
              Introducing AutoML Studio
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Build Machine Learning Models{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Without Writing Hundreds of Lines of Code.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="mt-6 text-xl md:text-2xl text-muted-foreground font-medium">
              Upload. Train. Compare. Download.
            </motion.p>
            
            <motion.div variants={fadeIn} className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full shadow-lg hover:shadow-primary/25 transition-shadow">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full">
                View Documentation
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Hero Illustration / Floating Cards */}
        <div className="relative h-[400px] md:h-[500px] w-full hidden lg:block">
          {/* Decorative background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/20 blur-[100px] rounded-full" />
          
          <FloatingCard 
            delay={0}
            className="top-10 right-10 w-64 bg-card border-success/20 shadow-xl"
          >
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Random Forest</div>
                <div className="text-success text-xs font-bold px-2 py-0.5 bg-success/10 rounded">94.2% Acc</div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success w-[94.2%]" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard 
            delay={1}
            className="top-40 left-0 w-72 bg-card shadow-2xl z-20"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">CSV</div>
                <div>
                  <div className="text-sm font-bold text-foreground">sales_data_2024.csv</div>
                  <div className="text-xs text-muted-foreground">1.2M rows • 14 features</div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 flex-1 bg-primary rounded-full" />
                <div className="h-1.5 flex-1 bg-primary/40 rounded-full" />
                <div className="h-1.5 flex-1 bg-primary/20 rounded-full" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard 
            delay={2}
            className="bottom-10 right-20 w-56 bg-card border-warning/20 shadow-lg"
          >
            <div className="p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-warning/10 border border-warning/20 flex animate-spin items-center justify-center" style={{ animationDuration: '3s' }}>
                <div className="w-2 h-2 rounded-full bg-warning" />
              </div>
              <div>
                <div className="text-sm font-bold">Training XGBoost...</div>
                <div className="text-xs text-muted-foreground">Epoch 42/100</div>
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
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: [0, -15, 0],
      }}
      transition={{ 
        opacity: { duration: 0.8, delay: delay * 0.2 },
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.5,
        }
      }}
      className={cn("absolute rounded-xl border p-1", className)}
    >
      {children}
    </motion.div>
  );
}
