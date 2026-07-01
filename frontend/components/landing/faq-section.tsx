"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function FaqSection({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const faqs = [
    {
      question: "Do I need to know how to code to use AutoML Studio?",
      answer: "Not at all. AutoML Studio is designed to be entirely no-code. You simply upload your dataset, select what you want to predict, and the platform handles the rest.",
    },
    {
      question: "What types of datasets are supported?",
      answer: "Currently, we support tabular datasets in CSV and JSON formats. You can build models for classification (predicting categories) or regression (predicting continuous values).",
    },
    {
      question: "Can I export the trained models?",
      answer: "Yes! Once training is complete, you can download the best-performing model along with a simple Python script to use it locally or deploy it to your own servers.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We do not store your datasets after the training process is complete. All data processing is done securely.",
    },
  ];

  return (
    <section id="faq" className={cn("py-24 bg-background", className)}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
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
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-muted/50 transition-colors focus:outline-none"
      >
        <span className="font-semibold text-base md:text-lg">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-4 md:p-6 pt-0 text-muted-foreground border-t border-border">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
