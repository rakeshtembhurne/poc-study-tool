'use client';

import { Progress } from '@/components/ui/progress';

interface UploadProgressProps {
  progress: number;
  isUploading: boolean;
}

export default function UploadProgress({
  progress,
  isUploading,
}: UploadProgressProps) {
  if (progress === 0 && !isUploading) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Creating cards...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
