import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { SupportedStackSection } from "@/components/landing/supported-stack-section";
import { DemoSection } from "@/components/landing/demo-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { OpenSourceSection } from "@/components/landing/open-source-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <SupportedStackSection />
      <DemoSection />
      <FeaturesSection />
      <ComparisonSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <OpenSourceSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
