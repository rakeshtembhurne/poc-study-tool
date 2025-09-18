import FileUpload from '@/components/FileUpload';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Card - Spaced Repetition',
  description: 'Create a new card',
};

export default function CreateCardPage() {
  return <FileUpload />;
}
