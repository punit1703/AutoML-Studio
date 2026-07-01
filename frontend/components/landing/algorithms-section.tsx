"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { scaleUp } from "@/lib/animations";

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
    <section id="algorithms" className={cn("py-24 bg-primary text-primary-foreground", className)}>
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
          Powered by industry standards.
        </h2>
        <p className="text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
          AutoML Studio trains multiple models simultaneously, benchmarking them against your dataset to find the optimal solution.
        </p>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {algorithms.map((algo, idx) => (
            <motion.div
              key={algo}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1, transition: { delay: idx * 0.05, duration: 0.3 } },
              }}
              className="px-4 py-2 md:px-6 md:py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-medium text-sm md:text-base shadow-sm"
            >
              {algo}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
