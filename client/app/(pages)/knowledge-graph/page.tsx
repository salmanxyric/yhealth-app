import KnowledgeGraphPageContent from './KnowledgeGraphPageContent';
import { PageAccessGate } from '@/components/gates/PageAccessGate';

export const metadata = {
  title: 'Knowledge Graph - Visualize Your Health Data | Balencia',
  description: 'Interactive knowledge graph showing connections between your workouts, nutrition, sleep, mood, goals, and AI insights. Discover patterns in your health data.',
};

export default function KnowledgeGraphPage() {
  return (
    <PageAccessGate pageKey="knowledge-graph" requiredPlan="Pro">
      <KnowledgeGraphPageContent />
    </PageAccessGate>
  );
}
