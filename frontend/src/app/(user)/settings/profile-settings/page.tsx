import ProfileSettingsComponent from '@/components/settings/SettingsComponent';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Profile Settings - Spaced Repetition',
  description: 'View your profile settings',
};
export default function ProfileSettingsPage() {
  return <ProfileSettingsComponent />;
}
