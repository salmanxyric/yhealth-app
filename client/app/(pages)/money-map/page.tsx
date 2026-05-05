import { createMetadata } from '@/lib/seo';
import MoneyMapPageContent from './MoneyMapPageContent';
import { PageAccessGate } from '@/components/gates/PageAccessGate';

export const metadata = createMetadata({
  title: 'Money Map - Smart Finance Tracker | Balencia',
  description: 'Track expenses, manage budgets, set savings goals, and get AI-powered financial insights — all in one place.',
  path: '/money-map',
  noIndex: true,
});

export default function MoneyMapPage() {
  return (
    <PageAccessGate pageKey="money-map" requiredPlan="Pro">
      <MoneyMapPageContent />
    </PageAccessGate>
  );
}
