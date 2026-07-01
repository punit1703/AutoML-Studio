"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { BrainCircuit, Code2, Zap, Download } from "lucide-react";

export function FeaturesSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const features = [
    {
      title: "No-Code Required",
      description: "Upload your dataset and let AutoML Studio handle the data preprocessing, model selection, and hyperparameter tuning automatically.",
      icon: <Code2 className="w-8 h-8 text-primary" />,
      className: "md:col-span-2 md:row-span-2",
    },
    {
      title: "State-of-the-art Models",
      description: "Train using industry-standard algorithms like Random Forests, XGBoost, and deep neural networks.",
      icon: <BrainCircuit className="w-6 h-6 text-primary" />,
      className: "md:col-span-1",
    },
    {
      title: "Lightning Fast",
      description: "Optimized training pipelines ensure your models are trained efficiently in parallel.",
      icon: <Zap className="w-6 h-6 text-primary" />,
      className: "md:col-span-1",
    },
    {
      title: "Easy Export",
      description: "Download the trained model and inference code to deploy anywhere instantly.",
      icon: <Download className="w-6 h-6 text-primary" />,
      className: "md:col-span-2",
    },
  ];

  return (
    <section id="features" className={cn("py-32 bg-background relative", className)}>
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Everything you need. <br />
            <span className="text-muted-foreground">Nothing you don't.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
          {features.map((feature, idx) => (
            <BentoCard key={idx} feature={feature} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BentoCard({ feature, idx }: { feature: any, idx: number }) {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.7, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] } }
      }}
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border border-border/50 bg-card p-8 shadow-sm overflow-hidden",
        feature.className
      )}
      onMouseMove={handleMouseMove}
    >
      {/* Hover Gradient Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(56, 189, 248, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-out border border-primary/20 shadow-inner">
          {feature.icon}
        </div>
        <h3 className="text-2xl font-bold tracking-tight mb-3">{feature.title}</h3>
        <p className="text-muted-foreground leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}
