import { createMetadata } from '@/lib/seo';
import ResetPasswordPageContent from './ResetPasswordPageContent';

export const metadata = createMetadata({
  title: 'Reset Password - YHealth',
  description: 'Reset your YHealth account password.',
  path: '/reset-password',
  noIndex: true,
});

export default function ResetPasswordPage() {
  return <ResetPasswordPageContent />;
}
