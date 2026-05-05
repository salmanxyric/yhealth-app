import { SEO } from '@/lib/seo';
import VoiceAssistantPageContent from './VoiceAssistantPageContent';
import { PageAccessGate } from '@/components/gates/PageAccessGate';

export const metadata = SEO.voiceAssistant;

export default function VoiceAssistantPage() {
  return (
    <PageAccessGate pageKey="voice-assistant" requiredPlan="Pro">
      <VoiceAssistantPageContent />
    </PageAccessGate>
  );
}
