import { SEO } from '@/lib/seo';
import VoiceCallPageContent from './VoiceCallPageContent';
import { PageAccessGate } from '@/components/gates/PageAccessGate';

export const metadata = SEO.voiceCall;

export default function VoiceCallPage() {
  return (
    <PageAccessGate pageKey="voice-call" requiredPlan="Pro">
      <VoiceCallPageContent />
    </PageAccessGate>
  );
}
