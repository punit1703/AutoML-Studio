"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function AlgorithmsSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const algorithms = [
    "Random Forest",
    "XGBoost",
    "LightGBM",
    "Gradient Boosting",
    "Logistic Regression",
    "Support Vector Machines",
    "Neural Networks (MLP)",
    "Decision Trees",
    "K-Nearest Neighbors",
    "Ridge Regression",
    "Lasso Regression",
    "Elastic Net",
  ];

  return (
    <section id="algorithms" className={cn("relative py-32 overflow-hidden bg-background text-foreground", className)}>
      
      {/* Deep Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          Powered by industry standards.
        </h2>
        <p className="text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
          AutoML Studio trains multiple models simultaneously, benchmarking them against your dataset to find the absolute best solution.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {algorithms.map((algo, idx) => (
            <motion.div
              key={algo}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                initial: { opacity: 0, scale: 0.9, y: 20 },
                animate: { opacity: 1, scale: 1, y: 0, transition: { delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="px-6 py-3 rounded-md bg-[#09090b] border border-white/10 font-mono text-sm md:text-base shadow-sm hover:border-primary/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all duration-300 text-foreground flex items-center gap-2"
            >
              <span className="text-primary">{`>`}</span> {algo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
