import * as React from "react";
import { StudioSidebar } from "@/components/studio/sidebar";
import { StudioTopNavbar } from "@/components/studio/top-navbar";
import { StudioOutputPanel } from "@/components/studio/output-panel";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/40 selection:text-white">
      {/* Sidebar (Fixed Width, Full Height) */}
      <StudioSidebar />

      {/* Main Content Area (Flex-1) */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top Navbar */}
        <StudioTopNavbar />

        {/* Workspace Area (Scrollable) */}
        <main className="flex-1 overflow-auto bg-[#000000] relative">
          {/* Subtle Grid Background for the Workspace */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
          
          <div className="relative z-10 w-full h-full p-6">
            {children}
          </div>
        </main>

        {/* Output Panel (Collapsible Bottom Pane) */}
        <StudioOutputPanel />
      </div>
    </div>
  );
}
