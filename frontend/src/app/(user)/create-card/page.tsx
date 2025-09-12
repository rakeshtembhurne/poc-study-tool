import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Card - Spaced Repetition',
  description: 'Create a new card',
};

export default function CreateCardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[80vw] mx-auto space-y-8">
        <h1 className="text-3xl text-foreground font-bold">Create Card</h1>
      </div>
    </div>
  );
}
