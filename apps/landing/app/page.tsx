import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { SupportedStackSection } from "@/components/landing/supported-stack-section";

import { FeaturesSection } from "@/components/landing/features-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";

import { OpenSourceSection } from "@/components/landing/open-source-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <SupportedStackSection />

      <FeaturesSection />
      <ComparisonSection />
      <HowItWorksSection />

      <OpenSourceSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
