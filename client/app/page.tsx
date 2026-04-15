import { SEO } from "@/lib/seo";
import { MainLayout } from "@/components/layout";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";

export const metadata = SEO.home;

export default function HomePage() {
  return (
    <MainLayout>
      <section className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="text-center space-y-4 px-6">
          <h1 className="text-4xl sm:text-6xl font-semibold text-white tracking-tight">
            yHealth
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            New cinematic experience landing soon.
          </p>
        </div>
      </section>
      <PricingSection />
      <FAQSection />
    </MainLayout>
  );
}
