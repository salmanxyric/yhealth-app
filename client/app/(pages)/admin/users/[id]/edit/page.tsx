import { createMetadata } from '@/lib/seo';
import EditUserPageContent from './EditUserPageContent';

export const metadata = createMetadata({
  title: 'Edit User - YHealth Admin',
  description: 'Edit user account settings.',
  path: '/admin/users/edit',
  noIndex: true,
});

export default function EditUserPage() {
  return <EditUserPageContent />;
}
