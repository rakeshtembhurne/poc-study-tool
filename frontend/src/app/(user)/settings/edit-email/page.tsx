import EditEmailPage from '@/components/settings/EditEmailPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email and Password Update - Spaced Repetition',
  description: 'Update your email and password',
};

export default function EmailPage() {
  return <EditEmailPage />;
}
