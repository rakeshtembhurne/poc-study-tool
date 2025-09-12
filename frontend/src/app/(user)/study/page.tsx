import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study - Spaced Repetition',
  description: 'Study your cards',
};

export default function StudyPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[80vw] mx-auto space-y-8">
        <h1 className="text-3xl text-foreground font-bold">Study</h1>
      </div>
    </div>
  );
}
