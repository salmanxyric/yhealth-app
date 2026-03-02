import { createMetadata } from '@/lib/seo';
import AdminUsersPageContent from './AdminUsersPageContent';

export const metadata = createMetadata({
  title: 'Users - YHealth Admin',
  description: 'Manage platform users.',
  path: '/admin/users',
  noIndex: true,
});

export default function AdminUsersPage() {
  return <AdminUsersPageContent />;
}
