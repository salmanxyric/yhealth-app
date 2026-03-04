import { SEO } from "@/lib/seo";
import { MainLayout } from "@/components/layout";
import HeroSection from "@/components/landing/hero-section";
import { TrustBarSection } from "@/components/landing/trust-bar-section";
import { ProblemPainSection } from "@/components/landing/problem-pain-section";
import { FitnessCarouselSection } from "@/components/landing/fitness-carousel-section";
import { ThreePillarsSection } from "@/components/landing/three-pillars-section";
import { BeforeAfterSection } from "@/components/landing/before-after-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { AIChatDemoSection } from "@/components/landing/ai-chat-demo-section";
import { VoiceCoachSection } from "@/components/landing/voice-coach-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { ComparisonTableSection } from "@/components/landing/comparison-table-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { AppDownloadSection } from "@/components/landing/app-download-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";

export const metadata = SEO.home;

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <TrustBarSection />
      <ProblemPainSection />
      <FitnessCarouselSection />
      <ThreePillarsSection />
      <BeforeAfterSection />
      <HowItWorksSection />
      <AIChatDemoSection />
      <VoiceCoachSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <ComparisonTableSection />
      <PricingSection />
      <AppDownloadSection />
      <FAQSection />
      <CTASection />
    </MainLayout>
  );
}
