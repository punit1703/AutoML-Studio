"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Code2, Zap, Download } from "lucide-react";
import { scaleUp } from "@/lib/animations";

export function FeaturesSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const features = [
    {
      title: "No-Code Required",
      description: "Upload your dataset and let AutoML Studio handle the data preprocessing, model selection, and hyperparameter tuning automatically.",
      icon: <Code2 className="w-6 h-6 text-primary" />,
    },
    {
      title: "State-of-the-art Models",
      description: "Train using industry-standard algorithms like Random Forests, XGBoost, and deep neural networks with a single click.",
      icon: <BrainCircuit className="w-6 h-6 text-primary" />,
    },
    {
      title: "Lightning Fast",
      description: "Optimized training pipelines ensure your models are trained efficiently, saving you hours of manual configuration.",
      icon: <Zap className="w-6 h-6 text-primary" />,
    },
    {
      title: "Easy Export",
      description: "Once satisfied with the model performance, download the trained model and inference code to deploy anywhere.",
      icon: <Download className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <section id="features" className={cn("py-24 bg-secondary/50", className)}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Everything you need to build ML models.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A complete platform designed to make machine learning accessible, fast, and powerful.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                initial: { opacity: 0, y: 30 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.1 } }
              }}
            >
              <Card className="h-full border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-foreground/70 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
