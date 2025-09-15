'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, ArrowLeft, Edit, FileText } from 'lucide-react';
import {
  Card as CardType,
  FileValidationConfig,
  CreationMethod,
} from '@/types/card';
import FileDropZone from './FileDropZone';
import UploadProgress from './UploadProgress';
import ViewCardsDialog from './ViewCardsDialog';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCards, setShowCards] = useState<boolean>(false);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setParsedCards([]);
    setCardCount(0);
    setShowCards(false);
    setProgress(0);
    setIsUploading(false);
    setUploadError(null);
  };

  const handleFileRemove = () => {
    setFile(null);
    setError(null);
    setParsedCards([]);
    setCardCount(0);
    setShowCards(false);
    setProgress(0);
    setUploadError(null);
    setIsUploading(false);
  };

  const validationConfig: FileValidationConfig = {
    allowedTypes: ['text/plain', 'application/pdf'], // allow .pdf
    maxSize: 10 * 1024 * 1024,
  };

  const parseFileContent = async (file: File): Promise<CardType[]> => {
    if (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    ) {
      return [
        {
          question: 'PDF File Uploaded',
          answer: `File Name: ${file.name}`,
          difficulty: 'Medium',
        },
      ];
    } else {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      return lines.map((line, index) => {
        const parts = line.split('|');
        if (parts.length >= 2) {
          return {
            question: parts[0].trim(),
            answer: parts[1].trim(),
            difficulty: parts[2]?.trim() || 'Medium',
          };
        } else {
          return {
            question: `Paragraph ${index + 1}`,
            answer: line.trim(),
            difficulty: 'Medium',
          };
        }
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    if (error) return;
    if (!deckName.trim()) {
      setError('Please enter a deck name.');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);
    setUploadError(null);
    setShowCards(false);

    // read file
    const cards = await parseFileContent(file);
    setCardCount(cards.length);
    setParsedCards(cards);

    // simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setShowCards(true);
          return 100;
        }
        return newProgress;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Create New Card
              </h1>
              <p className="text-sm text-muted-foreground">
                Add flashcards to your collection
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Creation Method Selection */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-foreground mb-6">
                Choose Creation Method
              </h2>
              <div className="flex gap-4 justify-center">
                <Button
                  variant={creationMethod === 'manual' ? 'default' : 'outline'}
                  onClick={() => setCreationMethod('manual')}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Edit className="h-4 w-4" />
                  Manual Form
                </Button>
                <Button
                  variant={creationMethod === 'file' ? 'default' : 'outline'}
                  onClick={() => setCreationMethod('file')}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Upload className="h-4 w-4" />
                  File Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {creationMethod === 'file' && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Upload className="h-5 w-5" />
                Bulk Upload from File
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              {/* Deck Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="deckName"
                  className="text-sm font-medium text-foreground"
                >
                  Deck Name
                </Label>
                <Input
                  id="deckName"
                  placeholder="Enter name for the new deck..."
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
              </div>

              <FileDropZone
                file={file}
                isDragging={isDragging}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                onDragStateChange={setIsDragging}
                onError={setError}
                validationConfig={validationConfig}
              />

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {file && !showCards && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    variant="default"
                    className="flex-1 text-base font-medium"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                  <Button variant="outline" onClick={handleFileRemove}>
                    Cancel
                  </Button>
                </div>
              )}

              <UploadProgress progress={progress} isUploading={isUploading} />

              {uploadError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {showCards && cardCount > 0 && (
                <div className="space-y-4">
                  <ViewCardsDialog
                    file={file}
                    parsedCards={parsedCards}
                    cardCount={cardCount}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  📝 Instructions
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>Manual Form:</strong> Create cards one by one using
                    the form above.
                  </p>
                  <p>
                    <strong>File Upload:</strong> Upload a .txt file with
                    multiple cards at once.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
