'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ArrowLeft } from 'lucide-react';
import {
  Card as CardType,
  FileValidationConfig,
  CreationMethod,
} from '@/types/card';
import FileDropZone from './FileDropZone';
import FilePreview from './FilePreview';
// import UploadProgress from './UploadProgress';
import UploadConfirmDialog from './UploadConfirmDialog';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [parsedCards, setParsedCards] = useState<CardType[]>([]);
  const [deckName, setDeckName] = useState<string>('');
  const [creationMethod, setCreationMethod] = useState<CreationMethod>('file');
  const [cardCount, setCardCount] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadFailed, setUploadFailed] = useState<boolean>(false);

  // NEW state for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validationConfig: FileValidationConfig = {
    allowedTypes: ['text/plain'],
    maxSize: 10 * 1024 * 1024, // 10 MB
  };

  const parseFileContent = (content: string): CardType[] => {
    const lines = content.split('\n').filter((line) => line.trim());
    return lines
      .map((line) => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          return {
            question: parts[0].trim(),
            answer: parts[1].trim(),
            difficulty: parts[2]?.trim() || 'Medium',
          };
        }
        return null;
      })
      .filter((card): card is CardType => card !== null);
  };

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    // Read file content (but don’t auto-create cards)
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const cards = parseFileContent(content);
      setCardCount(cards.length);
      setParsedCards(cards);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragStateChange = (isDragging: boolean) => {
    setIsDragging(isDragging);
  };

  // Called when user CONFIRMS in the popup
  const handleConfirmUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);
    setUploadError(null);
    setUploadFailed(false);
    setUploadSuccess(false);

    // Simulate upload with potential failure (30% chance of failure)
    const shouldFail = Math.random() < 0.3;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 10;

        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          if (shouldFail) {
            // Simulate upload failure
            setUploadFailed(true);
            setUploadError(
              'Upload failed: Network error occurred. Please try again.'
            );
          } else {
            // Successful upload
            setUploadSuccess(true);
            setIsDialogOpen(false); // Close popup after successful upload
          }

          return 100;
        }

        // Simulate failure at random progress point (if shouldFail is true)
        if (shouldFail && newProgress >= 60 && newProgress < 70) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadFailed(true);
          setUploadError(
            'Upload failed: Connection timeout. Please check your internet and try again.'
          );
          return newProgress;
        }

        return newProgress;
      });
    }, 200);
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    setUploadFailed(false);
    setProgress(0);
    handleConfirmUpload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Create Card</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* File Upload Section */}
        {creationMethod === 'file' && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5" />
                Bulk Upload from File
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Deck Name */}
              <div className="space-y-2">
                <Label htmlFor="deckName">Deck Name</Label>
                <Input
                  id="deckName"
                  placeholder="Enter name for the new deck..."
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
              </div>

              {/* File Drop Zone */}
              <FileDropZone
                file={file}
                isDragging={isDragging}
                onFileSelect={handleFileSelect}
                onDragStateChange={handleDragStateChange}
                onError={setError}
                validationConfig={validationConfig}
              />

              {/* Show file info (but not cards directly) */}
              <FilePreview file={file} parsedCards={[]} />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setIsDialogOpen(true)} // ✅ open popup
                  disabled={!file || isUploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  View {cardCount} Cards
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setCardCount(0);
                    setParsedCards([]);
                    setError(null);
                    setDeckName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm Upload Popup */}
        <UploadConfirmDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          file={file}
          parsedCards={parsedCards}
          deckName={deckName}
          onConfirmUpload={handleConfirmUpload}
          onRetry={handleRetryUpload}
          progress={progress}
          isUploading={isUploading}
          uploadError={uploadError}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
