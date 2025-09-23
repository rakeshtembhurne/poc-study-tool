'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Upload, FileText, ChevronDown } from 'lucide-react';
import {
  Card as CardType,
  FileValidationConfig,
  FileCardData,
} from '@/types/card';
import FileDropZone from './FileDropZone';
import UploadProgress from './UploadProgress';
import ViewCardsDialog from './ViewCardsDialog';
import authStorage from '@/lib/auth-storage';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import { toast } from 'sonner';

interface Deck {
  id: number;
  title: string;
  description?: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

const deckFormSchema = yup.object({
  deckName: yup.string().required('Deck selection is required'),
});

type DeckFormData = yup.InferType<typeof deckFormSchema>;

export default function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetchDecksError, setFetchDecksError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileCardData, setFileCardData] = useState<FileCardData[]>([]);
  const [totalCardCount, setTotalCardCount] = useState<number>(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState<boolean>(false);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(
    undefined
  );

  const form = useForm<DeckFormData>({
    resolver: yupResolver(deckFormSchema),
    defaultValues: {
      deckName: '',
    },
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCards, setShowCards] = useState<boolean>(false);

  const fetchDecks = async () => {
    setIsLoadingDecks(true);
    setFetchDecksError(null);

    try {
      const authToken = authStorage.getToken();
      if (!authToken) {
        setFetchDecksError(
          'Authentication required. Please login to view your decks.'
        );
        return;
      }

      const url = API_ENDPOINTS.v1.decks.fetch;
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const result = response.data;
      if (result.success) {
        const decksArray = result.data?.deck || [];
        if (Array.isArray(decksArray)) {
          setDecks(decksArray); // store full deck objects, not just title
        } else {
          setDecks([]);
          setFetchDecksError(
            'No decks found. Create your first deck to get started.'
          );
        }
      } else {
        setFetchDecksError(
          result.message || 'Failed to fetch decks. Please try again.'
        );
      }
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred while fetching decks.';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        switch (status) {
          case 401:
            errorMessage =
              'Session expired. Please login again to view your decks.';
            authStorage.removeToken();
            break;
          default:
            errorMessage =
              data?.message ||
              `Failed to fetch decks (${status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      }
      setFetchDecksError(errorMessage);
    } finally {
      setIsLoadingDecks(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

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
    allowedTypes: ['text/plain', 'application/pdf'],
    maxSize: 10 * 1024 * 1024,
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formValues = form.getValues();
    const deckNameValue = formValues.deckName?.trim();

    if (!deckNameValue) {
      setUploadError('Please select a deck before uploading.');
      setIsUploading(false);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setProgress(0);

    try {
      const authToken = authStorage.getToken();
      if (!authToken) {
        setUploadError(
          'Authentication required. Please login to upload files.'
        );
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const url = API_ENDPOINTS.v1.fileUpload.upload;
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        },
      });

      const result = response.data;
      if (result.success) {
        const backendFiles = result.data || [];
        const newFileCardData: FileCardData[] = [];
        const allCards: CardType[] = [];

        backendFiles.forEach((backendFile: any, index: number) => {
          const originalFile = files[index];
          const cards: CardType[] = [];
          let fileError: string | undefined;

          if (
            backendFile.flashcardGenerationStatus === 'success' &&
            backendFile.flashcards?.parsedFlashcards
          ) {
            backendFile.flashcards.parsedFlashcards.forEach(
              (flashcard: any) => {
                cards.push({
                  question: flashcard.question,
                  answer: flashcard.answer,
                  deckName: deckNameValue,
                  createdAt: new Date().toISOString(),
                  difficulty: flashcard.difficulty || 'Medium',
                });
              }
            );
          } else {
            fileError =
              backendFile.flashcardError ||
              'Failed to generate cards from file';
          }

          allCards.push(...cards);
          newFileCardData.push({
            file: originalFile,
            cards,
            error: fileError,
          });
        });

        setFileCardData(newFileCardData);
        setTotalCardCount(allCards.length);
        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setShowCards(true);
        }, 500);
      } else {
        setUploadError(result.message || 'Upload failed. Please try again.');
        setIsUploading(false);
      }
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred during upload.';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        switch (status) {
          case 401:
            errorMessage =
              'Session expired. Please login again to upload files.';
            authStorage.removeToken();
            break;
          default:
            errorMessage =
              data?.message || `Upload failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      }
      setUploadError(errorMessage);
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleConfirmUpload = async (uploadedCards: CardType[]) => {
    // Clear file-related states
    setFiles([]);
    setFileCardData([]);
    setTotalCardCount(0);
    setShowCards(false);
    setProgress(0);
    setIsUploading(false);
    setError(null);
    setUploadError(null);

    // Clear deck selection and reset form
    setSelectedDeck('');
    setSelectedDeckId(undefined);
    form.reset({ deckName: '' });

    // Show success toast
    toast.success(`${uploadedCards.length} cards uploaded successfully!`);
  };
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Upload className="h-5 w-5" />
          Bulk Upload from File
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="deckName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">
                  Select Deck
                </FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-left font-normal"
                          disabled={isLoadingDecks}
                        >
                          {isLoadingDecks
                            ? 'Loading decks...'
                            : selectedDeck
                              ? selectedDeck
                              : 'Select a deck...'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-none z-50"
                        align="start"
                        sideOffset={4}
                      >
                        {decks.length > 0 ? (
                          decks.map((deck) => (
                            <DropdownMenuItem
                              key={deck.id}
                              className="w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                              onClick={() => {
                                setSelectedDeck(deck.title); // set name
                                setSelectedDeckId(deck.id); // set ID
                                form.setValue('deckName', deck.title); // update react-hook-form
                              }}
                            >
                              <span className="truncate">{deck.title}</span>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled className="w-full">
                            {isLoadingDecks
                              ? 'Loading...'
                              : fetchDecksError || 'No decks available'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {fetchDecksError && (
                      <div className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="text-sm text-destructive">
                          {fetchDecksError}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchDecks}
                          disabled={isLoadingDecks}
                          className="ml-2 h-8 px-3 text-xs"
                        >
                          {isLoadingDecks ? 'Retrying...' : 'Retry'}
                        </Button>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

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
              variant="outline"
              onClick={() => setFiles([])}
              className="flex-1 text-base font-medium"
            >
              Cancel
            </Button>
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
                        <p className="text-xs text-destructive">{data.error}</p>
                      </div>
                    )}
                    {data.cards.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          Preview: {data.cards[0].question.substring(0, 50)}...
                        </div>
                        <div className="flex justify-end">
                          <ViewCardsDialog
                            fileCardData={data}
                            deckName={selectedDeck}
                            deckId={selectedDeckId}
                            onConfirmUpload={handleConfirmUpload} // <-- pass callback
                          />
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
  );
}
