import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { WorkflowSection } from "@/components/landing/workflow-section";
import { AlgorithmsSection } from "@/components/landing/algorithms-section";
import { FaqSection } from "@/components/landing/faq-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <AlgorithmsSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
