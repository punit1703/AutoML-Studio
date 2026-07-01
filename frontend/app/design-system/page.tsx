"use client";

import * as React from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Navbar } from "@/components/ui/navbar";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import { scaleUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

export default function DesignSystemPreview() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-12 pb-24">
            
            <section>
              <SectionHeading 
                title="Typography & Colors" 
                description="The core visual identity of AutoML Studio." 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Palette</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ColorSwatch name="Primary Blue" value="#0A66C2" bgClass="bg-primary" />
                    <ColorSwatch name="Sidebar" value="#0F172A" bgClass="bg-sidebar" />
                    <ColorSwatch name="Background" value="#F8FAFC" bgClass="bg-[#F8FAFC]" border />
                    <ColorSwatch name="Success" value="#22C55E" bgClass="bg-success" />
                    <ColorSwatch name="Warning" value="#F59E0B" bgClass="bg-warning" />
                    <ColorSwatch name="Error" value="#EF4444" bgClass="bg-destructive" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Typography (Geist)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-4xl font-bold">Heading 1</span>
                    </div>
                    <div>
                      <span className="text-3xl font-semibold">Heading 2</span>
                    </div>
                    <div>
                      <span className="text-2xl font-medium">Heading 3</span>
                    </div>
                    <div>
                      <p className="text-base text-foreground">
                        Primary Text. The quick brown fox jumps over the lazy dog.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Secondary Text. Useful for descriptions and subtle labels.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <SectionHeading 
                title="Buttons" 
                description="Interactive elements for user actions with micro-animations." 
              />
              <Card>
                <CardContent className="p-6 flex flex-wrap gap-4 items-center">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive</Button>
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeading 
                title="Forms & Inputs" 
                description="Clean, data-centric form controls." 
              />
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input placeholder="Enter your email" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <label className="text-sm font-medium">Dataset Name</label>
                    <Input placeholder="e.g. sales_data_2023.csv" />
                    <p className="text-xs text-muted-foreground">Keep it short and descriptive.</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeading 
                title="Loading States" 
                description="Feedback during async operations." 
              />
              <Card>
                <CardContent className="p-6 flex gap-8 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-xs text-muted-foreground">Small</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="default" />
                    <span className="text-xs text-muted-foreground">Default</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="lg" />
                    <span className="text-xs text-muted-foreground">Large</span>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <SectionHeading 
                title="Cards & Hover Effects" 
                description="Cards feature subtle lift animations on hover." 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dataset Overview</CardTitle>
                    <CardDescription>Hover over me to see the card lift.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-24 bg-primary/5 rounded-md flex items-center justify-center border border-primary/10">
                      <span className="text-primary font-medium">Data Visualization Area</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline" size="sm">View Details</Button>
                  </CardFooter>
                </Card>
                
                <motion.div {...scaleUp}>
                  <Card className="h-full border-success/30 bg-success/5">
                    <CardHeader>
                      <CardTitle className="text-success">Training Complete</CardTitle>
                      <CardDescription>This card scaled up on mount.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Your model achieved an accuracy of 94.2% on the validation set.</p>
                    </CardContent>
                    <CardFooter>
                      <Button className="bg-success hover:bg-success/90 text-white">Deploy Model</Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

function ColorSwatch({ name, value, bgClass, border }: { name: string; value: string; bgClass: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-lg shadow-sm", bgClass, border && "border border-border")} />
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-sm text-muted-foreground">{value}</div>
      </div>
    </div>
  );
}
