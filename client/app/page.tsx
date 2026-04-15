import { SEO } from '@/lib/seo';
import { MainLayout } from '@/components/layout';
import { CinematicOverlays } from '@/components/landing/CinematicOverlays';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { LiquidBackdrop } from '@/app/scenes/_shell';

import Scene01_Hero from '@/app/scenes/Scene01_Hero';
import Scene02_ProblemSolution from '@/app/scenes/Scene02_ProblemSolution';
import Scene03_AIDashboard from '@/app/scenes/Scene03_AIDashboard';
import Scene04_DeviceShowcase from '@/app/scenes/Scene04_DeviceShowcase';
import Scene05_FeatureGrid from '@/app/scenes/Scene05_FeatureGrid';
import Scene06_LifeAreasCarousel from '@/app/scenes/Scene06_LifeAreasCarousel';
import Scene07_DataFlow from '@/app/scenes/Scene07_DataFlow';
import Scene08_Testimonials from '@/app/scenes/Scene08_Testimonials';
import Scene09_FinalCTA from '@/app/scenes/Scene09_FinalCTA';

export const metadata = SEO.home;

export default function HomePage() {
  return (
    <MainLayout>
      <LiquidBackdrop />
      <CinematicOverlays />
      <main className="cinematic-snap">
        <Scene01_Hero />
        <Scene02_ProblemSolution />
        <Scene03_AIDashboard />
        <Scene04_DeviceShowcase />
        <Scene05_FeatureGrid />
        <Scene06_LifeAreasCarousel />
        <Scene07_DataFlow />
        <Scene08_Testimonials />
        <Scene09_FinalCTA />
      </main>
      <PricingSection />
      <FAQSection />
    </MainLayout>
  );
}
