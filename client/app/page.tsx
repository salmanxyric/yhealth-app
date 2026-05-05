import "./landing.css";
import { MainLayout } from "@/components/layout";
import ScrollProgress from "@/components/landing/scroll-progress";
import HeroSection from "@/components/landing/hero-section";
import MarqueeSection from "@/components/landing/marquee-section";
import CiaIntroSection from "@/components/landing/cia-intro-section";
import { Galaxy3DSection } from "@/components/landing/galaxy-3d-section";
import { WellbeingCarouselSection } from "@/components/landing/wellbeing-carousel-section";
import { CiaFeaturesSection } from "@/components/landing/cia-features-section";
import { TimelineSection } from "@/components/landing/timeline-section";
import { StatsSection } from "@/components/landing/stats-section";
import MoreFeaturesSection from "@/components/landing/more-features-section";
import PrivacySection from "@/components/landing/privacy-section";
import { GallerySection } from "@/components/landing/gallery-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
import CTASection from "@/components/landing/cta-section";
import SpringLine from "@/components/landing/spring-line";

export default function HomePage() {
  return (
    <MainLayout>
      <SpringLine />
      <ScrollProgress />
      <HeroSection />
      <MarqueeSection />
      <CiaIntroSection />
      <Galaxy3DSection />
      <WellbeingCarouselSection />
      <CiaFeaturesSection />
      <TimelineSection />
      <StatsSection />
      <MoreFeaturesSection />
      <PrivacySection />
      <GallerySection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </MainLayout>
  );
}
