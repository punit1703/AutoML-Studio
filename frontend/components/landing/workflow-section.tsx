"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { UploadCloud, Settings2, Activity, ArrowDownToLine } from "lucide-react";

export function WorkflowSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const steps = [
    {
      title: "1. Upload Dataset",
      description: "Drop your CSV or JSON data. We automatically analyze data types and handle missing values.",
      icon: <UploadCloud className="w-8 h-8 text-primary" />,
    },
    {
      title: "2. Configure Target",
      description: "Select the column you want to predict. Choose between classification or regression.",
      icon: <Settings2 className="w-8 h-8 text-primary" />,
    },
    {
      title: "3. Train & Compare",
      description: "Watch in real-time as multiple algorithms train and compete to give you the highest accuracy.",
      icon: <Activity className="w-8 h-8 text-primary" />,
    },
    {
      title: "4. Download Model",
      description: "Export the best performing model along with Python code to run predictions immediately.",
      icon: <ArrowDownToLine className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <section id="workflow" className={cn("py-24", className)}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            How it works
          </h2>
        </div>

        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[39px] md:left-1/2 top-10 bottom-10 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

          <div className="space-y-16">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "relative flex flex-col md:flex-row items-center gap-8 md:gap-16",
                  idx % 2 === 1 ? "md:flex-row-reverse" : ""
                )}
              >
                {/* Text Side */}
                <div className={cn("flex-1 text-center md:text-left", idx % 2 === 1 && "md:text-right")}>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-lg text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Icon Center */}
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-background border-2 border-primary/20 shadow-xl flex items-center justify-center shrink-0">
                  {step.icon}
                </div>

                {/* Empty Side for balance */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
