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
  FileCardData,
} from '@/types/card';
import FileDropZone from './FileDropZone';
import UploadProgress from './UploadProgress';
import ViewCardsDialog from './ViewCardsDialog';

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileCardData, setFileCardData] = useState<FileCardData[]>([]);
  const [deckName, setDeckName] = useState<string>('');
  const [creationMethod, setCreationMethod] = useState<CreationMethod>('file');
  const [totalCardCount, setTotalCardCount] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCards, setShowCards] = useState<boolean>(false);

  const handleFilesSelect = (selectedFiles: File[]) => {
    setError(null);
    setFiles(selectedFiles);
    setFileCardData([]);
    setTotalCardCount(0);
    setShowCards(false);
    setProgress(0);
    setIsUploading(false);
    setUploadError(null);
  };

  const handleFileRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    if (updatedFiles.length === 0) {
      setError(null);
      setFileCardData([]);
      setTotalCardCount(0);
      setShowCards(false);
      setProgress(0);
      setUploadError(null);
      setIsUploading(false);
    }
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
    if (files.length === 0) {
      setError('Please select at least one file first.');
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

    // Process all files
    const allFileCardData: FileCardData[] = [];
    let totalCards = 0;

    for (const file of files) {
      try {
        const cards = await parseFileContent(file);
        allFileCardData.push({ file, cards });
        totalCards += cards.length;
      } catch {
        allFileCardData.push({
          file,
          cards: [],
          error: `Failed to parse ${file.name}`,
        });
      }
    }

    setFileCardData(allFileCardData);
    setTotalCardCount(totalCards);

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
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Manual Form
                </Button>
                <Button
                  variant={creationMethod === 'file' ? 'default' : 'outline'}
                  onClick={() => setCreationMethod('file')}
                  className="flex items-center gap-2"
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
                files={files}
                isDragging={isDragging}
                onFilesSelect={handleFilesSelect}
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

              {files.length > 0 && !showCards && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    variant="default"
                    className="flex-1 text-base font-medium"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading
                      ? 'Processing Files...'
                      : `Upload ${files.length} File${files.length > 1 ? 's' : ''}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                    className="flex-1 text-base font-medium" // ✅ add same class here
                  >
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

              {showCards && totalCardCount > 0 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-3">
                      Processing Results ({totalCardCount} total cards from{' '}
                      {fileCardData.length} file
                      {fileCardData.length > 1 ? 's' : ''})
                    </h3>
                    <div className="space-y-4">
                      {fileCardData.map((data, index) => (
                        <div
                          key={index}
                          className="bg-background rounded-lg p-4 border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                {data.file.name}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {data.cards.length} cards
                            </span>
                          </div>

                          {data.error && (
                            <div className="mb-3">
                              <p className="text-xs text-destructive">
                                {data.error}
                              </p>
                            </div>
                          )}

                          {data.cards.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-sm text-muted-foreground">
                                Preview:{' '}
                                {data.cards[0].question.substring(0, 50)}...
                              </div>
                              <div className="flex justify-end">
                                <ViewCardsDialog fileCardData={data} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
