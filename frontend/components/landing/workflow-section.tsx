"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { UploadCloud, Settings2, Activity, ArrowDownToLine } from "lucide-react";

export function WorkflowSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const steps = [
    {
      title: "Upload Dataset",
      description: "Drop your CSV or JSON data. We automatically analyze data types and handle missing values with zero configuration.",
      icon: <UploadCloud className="w-8 h-8 text-white" />,
    },
    {
      title: "Configure Target",
      description: "Select the column you want to predict. Choose between classification or regression, or let us auto-detect it.",
      icon: <Settings2 className="w-8 h-8 text-white" />,
    },
    {
      title: "Train & Compare",
      description: "Watch in real-time as multiple algorithms train and compete on a sleek leaderboard to give you the highest accuracy.",
      icon: <Activity className="w-8 h-8 text-white" />,
    },
    {
      title: "Download Model",
      description: "Export the best performing model along with production-ready Python inference code to deploy instantly.",
      icon: <ArrowDownToLine className="w-8 h-8 text-white" />,
    },
  ];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="workflow" className={cn("py-32 bg-secondary/30", className)}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            How it works
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            From raw data to a deployed model in four simple steps.
          </p>
        </div>

        <div className="relative" ref={containerRef}>
          {/* Background Track */}
          <div className="absolute left-[39px] md:left-1/2 top-4 bottom-4 w-1 bg-border rounded-full -translate-x-1/2 hidden md:block" />
          
          {/* Animated Gradient Line */}
          <motion.div 
            className="absolute left-[39px] md:left-1/2 top-4 w-1 bg-gradient-to-b from-primary via-blue-400 to-primary rounded-full -translate-x-1/2 hidden md:block origin-top shadow-[0_0_15px_rgba(10,102,194,0.5)]" 
            style={{ height: lineHeight }}
          />

          <div className="space-y-24">
            {steps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative flex flex-col md:flex-row items-center gap-8 md:gap-20",
                  idx % 2 === 1 ? "md:flex-row-reverse" : ""
                )}
              >
                {/* Text Side */}
                <div className={cn("flex-1 text-center md:text-left", idx % 2 === 1 && "md:text-right")}>
                  <div className="text-sm font-bold tracking-widest text-primary uppercase mb-2">Step 0{idx + 1}</div>
                  <h3 className="text-3xl font-bold tracking-tight mb-4">{step.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Glowing Icon Center */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-[0_0_30px_rgba(10,102,194,0.3)] flex items-center justify-center shrink-0 ring-8 ring-background">
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
