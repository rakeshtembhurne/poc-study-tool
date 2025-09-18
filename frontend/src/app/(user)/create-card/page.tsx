import { Metadata } from 'next';
import FileUpload from '@/components/FileUpload/FileUpload';

export const metadata: Metadata = {
  title: 'Create Card - Spaced Repetition',
  description: 'Create a new card',
};

export default function CreateCardPage() {
  return <FileUpload />;
}
