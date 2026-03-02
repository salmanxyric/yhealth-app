import { createMetadata } from '@/lib/seo';
import AdminSubscriptionsPageContent from './AdminSubscriptionsPageContent';

export const metadata = createMetadata({
  title: 'Subscriptions - YHealth Admin',
  description: 'Manage platform subscriptions.',
  path: '/admin/subscriptions',
  noIndex: true,
});

export default function AdminSubscriptionsPage() {
  return <AdminSubscriptionsPageContent />;
}
