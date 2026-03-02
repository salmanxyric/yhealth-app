import { createMetadata } from '@/lib/seo';
import WhoopPageContent from './WhoopPageContent';

export const metadata = createMetadata({
  title: 'WHOOP Integration - YHealth',
  description: 'Connect and manage your WHOOP wearable integration with YHealth.',
  path: '/whoop',
  noIndex: true,
});

export default function WhoopPage() {
  return <WhoopPageContent />;
}
