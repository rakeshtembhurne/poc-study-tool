import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - Spaced Repetition',
  description: 'View your settings',
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[80vw] mx-auto space-y-8">
        <h1 className="text-3xl text-foreground font-bold">Settings</h1>
      </div>
    </div>
  );
}
