import dynamic from 'next/dynamic';
import { SEO } from '@/lib/seo';
import { MainLayout } from '@/components/layout';
import { CinematicOverlays } from '@/components/landing/CinematicOverlays';
import { PricingSection } from '@/components/landing/pricing-section';
import { FAQSection } from '@/components/landing/faq-section';
import { SceneSkeleton } from '@/app/scenes/_shell';
import Scene01_Hero from '@/app/scenes/Scene01_Hero';

export const metadata = SEO.home;

// Scenes 2-9 are placeholder skeletons until Phases 2.B / 2.C implement them.
// SceneSkeleton is presentational and SSR-safe, so default SSR behavior is fine.
const Scene02 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Problem  Solution" /> }));
const Scene03 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="AI Dashboard" /> }));
const Scene04 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Devices" /> }));
const Scene05 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Features" /> }));
const Scene06 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Life Areas" /> }));
const Scene07 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Data Flow" /> }));
const Scene08 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Testimonials" /> }));
const Scene09 = dynamic(() => Promise.resolve({ default: () => <SceneSkeleton label="Final CTA" /> }));

export default function HomePage() {
  return (
    <MainLayout>
      <CinematicOverlays />
      <main>
        <Scene01_Hero />
        <Scene02 />
        <Scene03 />
        <Scene04 />
        <Scene05 />
        <Scene06 />
        <Scene07 />
        <Scene08 />
        <Scene09 />
      </main>
      <PricingSection />
      <FAQSection />
    </MainLayout>
  );
}
