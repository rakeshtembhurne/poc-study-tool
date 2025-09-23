'use client';

import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  progress: number;
  stage: 'idle' | 'uploading' | 'processing' | 'done';
}

export default function UploadProgress({
  progress,
  stage,
}: UploadProgressProps) {
  if (progress === 0 && stage === 'idle') return null;

  const label =
    stage === 'uploading'
      ? 'Uploading file...'
      : stage === 'processing'
        ? 'Processing cards...'
        : 'Completed';

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>

      <Progress value={progress} className="w-full" />
    </div>
  );
}
