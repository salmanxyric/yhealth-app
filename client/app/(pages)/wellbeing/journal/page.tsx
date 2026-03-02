import { SEO } from '@/lib/seo';
import JournalPageContent from './JournalPageContent';

export const metadata = SEO.wellbeingJournal;

export default function JournalPage() {
  return <JournalPageContent />;
}
