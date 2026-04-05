"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedByMarquee } from "@/components/landing/TrustedByMarquee";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionDemo } from "@/components/landing/SolutionDemo";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { AudienceCards } from "@/components/landing/AudienceCards";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StatsCounter } from "@/components/landing/StatsCounter";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LanguageProvider } from "@/i18n/LanguageContext";

export default function LandingPage() {
  return (
    <LanguageProvider>
      <main className="min-h-screen bg-white text-black overflow-x-hidden selection:bg-[#ff6029]/20">
        <LandingNavbar />
        <HeroSection />
        <TrustedByMarquee />
        <ProblemSection />
        <SolutionDemo />
        <FeaturesGrid />
        <AudienceCards />
        <HowItWorks />
        <StatsCounter />
        <TestimonialsCarousel />
        <CTASection />
        <LandingFooter />
      </main>
    </LanguageProvider>
  );
}
