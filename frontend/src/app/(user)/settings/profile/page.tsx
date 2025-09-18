import ProfileComponent from '@/components/settings/ProfileComponent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - Spaced Repetition',
  description: 'View your profile',
};

export default function ProfilePage() {
  return <ProfileComponent />;
}
