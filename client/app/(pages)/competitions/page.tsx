import { SEO } from '@/lib/seo';
import CompetitionsPageContent from './CompetitionsPageContent';
import { PageAccessGate } from '@/components/gates/PageAccessGate';

export const metadata = SEO.competitions;

export default function CompetitionsPage() {
  return (
    <PageAccessGate pageKey="competitions" requiredPlan="Pro">
      <CompetitionsPageContent />
    </PageAccessGate>
  );
}
