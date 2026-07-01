"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

export function FaqSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const faqs = [
    {
      question: "Do I need to know how to code to use AutoML Studio?",
      answer: "Not at all. AutoML Studio is designed to be entirely no-code. You simply upload your dataset, select what you want to predict, and the platform handles the rest automatically.",
    },
    {
      question: "What types of datasets are supported?",
      answer: "Currently, we support tabular datasets in CSV and JSON formats. You can build models for classification (predicting categories) or regression (predicting continuous values).",
    },
    {
      question: "Can I export the trained models?",
      answer: "Yes! Once training is complete, you can download the best-performing model along with a simple Python script to use it locally or deploy it to your own servers instantly.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We do not store your datasets after the training process is complete. All data processing is done securely in memory and discarded immediately.",
    },
  ];

  return (
    <section id="faq" className={cn("py-32 bg-background relative", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/20 pointer-events-none" />
      
      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Questions? <br />
            <span className="text-muted-foreground">We have answers.</span>
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <FaqItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-b border-border/50 last:border-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-6 text-left focus:outline-none group"
      >
        <span className="font-medium text-lg md:text-xl group-hover:text-primary transition-colors">{question}</span>
        <div className={cn("w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-transform duration-300", isOpen && "rotate-45 bg-primary/10 text-primary")}>
          <Plus className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="pb-6 text-muted-foreground text-lg leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
