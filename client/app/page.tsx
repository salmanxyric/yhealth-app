import { SEO } from "@/lib/seo";
import { MainLayout } from "@/components/layout";

export const metadata = SEO.home;
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  AIAppFlowSection,
  StatsSection,
  TestimonialsSection,
  PricingSection,
  IntegrationsSection,
  AppDownloadSection,
  FAQSection,
  CTASection,
} from "@/components/landing";

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AIAppFlowSection />
      <StatsSection />
      <TestimonialsSection />
      <IntegrationsSection />
      <PricingSection />
      <AppDownloadSection />
      <FAQSection />
      <CTASection />
    </MainLayout>
  );
}
