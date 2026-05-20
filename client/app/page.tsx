import { SEO } from "@/lib/seo";
import { MainLayout } from "@/components/layout";
import { CinematicExperience } from "@/components/cinematic/CinematicExperience";
import { CinematicSplashWrapper } from "@/components/preloader/CinematicSplashWrapper";
import { VoiceCoachSection } from "@/components/landing/voice-coach-section";
import { MotivationTiersSection } from "@/components/landing/motivation-tiers-section";
import { LifeGoalsSection } from "@/components/landing/life-goals-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { HealthOrbitSection } from "@/components/landing/health-orbit-section";
import { ComparisonTableSection } from "@/components/landing/comparison-table-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CTASection } from "@/components/landing/cta-section";

export const metadata = SEO.home;

export default function HomePage() {
  return (
    <MainLayout>
      <CinematicSplashWrapper />
      <CinematicExperience />
      <VoiceCoachSection />
      <MotivationTiersSection />
      <LifeGoalsSection />
      <HealthOrbitSection />
      <IntegrationsSection />
      <ComparisonTableSection />
      <PricingSection />
      <CTASection />
    </MainLayout>
  );
}
