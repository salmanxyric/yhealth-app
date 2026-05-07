import { SEO } from '@/lib/seo';
import QuickNotesPageContent from './QuickNotesPageContent';

export const metadata = SEO.quickNotes;

export default function QuickNotesPage() {
  return <QuickNotesPageContent />;
}
