'use client';

import { useState, useEffect, useRef } from 'react';
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
  // Smoothed visual progress to avoid sudden jumps in UI
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [fileCardData, setFileCardData] = useState<FileCardData[]>([]);
  const [totalCardCount, setTotalCardCount] = useState<number>(0);
  const [decks, setDecks] = useState<string[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState<boolean>(false);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [stage, setStage] = useState<
    'idle' | 'uploading' | 'processing' | 'done'
  >('idle');
  // lightweight toast state for top-right notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success' | null;
  }>({ message: '', type: null });
  const showToast = (
    message: string,
    type: 'error' | 'success' = 'error',
    duration = 4000
  ) => {
    setToast({ message, type });
    window.clearTimeout((showToast as any)._tid);
    (showToast as any)._tid = window.setTimeout(() => {
      setToast({ message: '', type: null });
    }, duration);
  };

  const form = useForm<DeckFormData>({
    resolver: yupResolver(deckFormSchema),
    defaultValues: {
      deckName: '',
    },
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCards, setShowCards] = useState<boolean>(false);
  const lastDisplayRef = useRef<number>(0);
  // Quick-fail timer to show AI failure toast if backend is slow; cleared on response
  const quickFailTimerRef = useRef<number | null>(null);
  const responseReceivedRef = useRef<boolean>(false);

  // Animate displayProgress towards progress for smoother UI
  useEffect(() => {
    if (lastDisplayRef.current === progress) return;
    let raf = 0;
    const duration = 1200; // ms - slower, smoother
    const start = performance.now();
    const from = lastDisplayRef.current;
    const to = progress;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Smoothstep easing for a less abrupt animation
      const eased = t * t * (3 - 2 * t);
      const next = Math.round(from + (to - from) * eased);
      setDisplayProgress(next);
      lastDisplayRef.current = next;
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

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

      // mark response received and clear quick-fail
      responseReceivedRef.current = true;
      if (quickFailTimerRef.current) {
        window.clearTimeout(quickFailTimerRef.current);
        quickFailTimerRef.current = null;
      }
      const result = response.data;
      if (result.success) {
        const decksArray = result.data?.deck || [];
        if (Array.isArray(decksArray)) {
          setDecks(decksArray.map((deck: Deck) => deck.title));
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
    setDisplayProgress(0);
    lastDisplayRef.current = 0;
    setIsUploading(false);
    setStage('idle');
    setUploadError(null);
  };

  // Clear all state and hide progress instantly
  const handleClearAll = () => {
    setError(null);
    setFiles([]);
    setFileCardData([]);
    setTotalCardCount(0);
    setShowCards(false);
    setProgress(0);
    setDisplayProgress(0);
    lastDisplayRef.current = 0;
    setIsUploading(false);
    setStage('idle');
    setUploadError(null);
  };

  const handleFileRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    if (updatedFiles.length === 0) {
      // Reset instantly so the progress bar disappears without animating backward
      setProgress(0);
      setDisplayProgress(0);
      lastDisplayRef.current = 0;
      setIsUploading(false);
      setStage('idle');
      setError(null);
      setFileCardData([]);
      setTotalCardCount(0);
      setShowCards(false);
      setUploadError(null);
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
    setDisplayProgress(0);
    lastDisplayRef.current = 0;
    // Do not show progress UI yet; wait for first progress event
    setStage('idle');
    // Start quick-fail timer right away; if server hasn't responded quickly, show toast
    if (quickFailTimerRef.current) {
      window.clearTimeout(quickFailTimerRef.current);
      quickFailTimerRef.current = null;
    }
    responseReceivedRef.current = false;
    quickFailTimerRef.current = window.setTimeout(() => {
      if (!responseReceivedRef.current) {
        showToast(
          'Unable to generate flashcards. All available AI models failed to respond.',
          'error'
        );
        setIsUploading(false);
        setStage('idle');
        setProgress(0);
        setDisplayProgress(0);
        lastDisplayRef.current = 0;
        setFiles([]);
        setShowCards(false);
      }
    }, 800); // show within ~0.8s of clicking Upload

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

      const totalBytes = files.reduce((sum, f) => sum + (f?.size || 0), 0);

      const url = API_ENDPOINTS.v1.fileUpload.upload;
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
        onUploadProgress: (progressEvent) => {
          // Suppress progress updates while quick-fail timer is active to avoid flicker
          if (quickFailTimerRef.current) {
            return;
          }
          // Prefer native total when available
          if (progressEvent.total && progressEvent.total > 0) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Avoid regressions, clamp to 100 to handle rounding
            setProgress((prev) => Math.max(prev, Math.min(100, percent)));
            if (percent > 0 && stage === 'idle') {
              setStage('uploading');
            }
            if (percent >= 100) {
              setStage('processing');
            }
            return;
          }

          if (totalBytes > 0) {
            const estimatedTotal = Math.max(
              totalBytes * 1.05,
              totalBytes + 1024
            );
            const percent = Math.round(
              (progressEvent.loaded * 100) / estimatedTotal
            );
            // Avoid regressions, clamp to 100 to handle rounding
            setProgress((prev) => Math.max(prev, Math.min(100, percent)));
            if (percent > 0 && stage === 'idle') {
              setStage('uploading');
            }
            if (percent >= 100) {
              setStage('processing');
            }
          }
        },
      });

      const result = response.data;
      if (result.success) {
        const backendFiles = result.data || [];
        const missingKeyMsg =
          'OpenAI API key not found in user profile. Please add your API key in settings.';
        const extractionErrorMsg = 'No text could be extracted from file';
        const aiModelsFailedMsg =
          'Unable to generate flashcards. All available AI models failed to respond.';
        const showMissingKeyError = Array.isArray(backendFiles)
          ? backendFiles.some(
              (f: any) =>
                f?.flashcardGenerationStatus === 'failed' &&
                typeof f?.flashcardError === 'string' &&
                f.flashcardError.includes(missingKeyMsg)
            )
          : false;
        if (showMissingKeyError) {
          showToast(missingKeyMsg, 'error');
        }
        const showExtractionError = Array.isArray(backendFiles)
          ? backendFiles.some(
              (f: any) =>
                f?.flashcardGenerationStatus === 'failed' &&
                typeof f?.flashcardError === 'string' &&
                f.flashcardError.includes(extractionErrorMsg)
            )
          : false;
        if (showExtractionError) {
          showToast(extractionErrorMsg, 'error');
        }
        const showAIModelsFailedError = Array.isArray(backendFiles)
          ? backendFiles.some(
              (f: any) =>
                f?.flashcardGenerationStatus === 'failed' &&
                typeof f?.flashcardError === 'string' &&
                f.flashcardError.includes(aiModelsFailedMsg)
            )
          : false;
        if (showAIModelsFailedError) {
          showToast(aiModelsFailedMsg, 'error');
        }

        // If we showed any of the above error toasts, hide the progress bar immediately
        if (
          showAIModelsFailedError ||
          showMissingKeyError ||
          showExtractionError
        ) {
          setIsUploading(false);
          setStage('idle');
          setProgress(0);
          setDisplayProgress(0);
          lastDisplayRef.current = 0;
          // Clear files so the conditional render guard (files.length > 0) also hides UploadProgress
          setFiles([]);
          setShowCards(false);
          if (quickFailTimerRef.current) {
            window.clearTimeout(quickFailTimerRef.current);
            quickFailTimerRef.current = null;
          }
          return;
        }

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
        // Server confirmed completion; finalize to 100% and mark done
        setProgress(100);
        setIsUploading(false);
        setStage('done');
        setShowCards(true);
        if (quickFailTimerRef.current) {
          window.clearTimeout(quickFailTimerRef.current);
          quickFailTimerRef.current = null;
        }
      } else {
        setUploadError(result.message || 'Upload failed. Please try again.');
        setIsUploading(false);
        setStage('idle');
        if (quickFailTimerRef.current) {
          window.clearTimeout(quickFailTimerRef.current);
          quickFailTimerRef.current = null;
        }
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
      setStage('idle');
      if (quickFailTimerRef.current) {
        window.clearTimeout(quickFailTimerRef.current);
        quickFailTimerRef.current = null;
      }
    }
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
                        {Array.isArray(decks) && decks.length > 0 ? (
                          decks.map((title, idx) => (
                            <DropdownMenuItem
                              key={idx}
                              className="w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                              onClick={() => {
                                setSelectedDeck(title);
                                field.onChange(title);
                              }}
                            >
                              <span className="truncate">{title}</span>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled className="w-full">
                            {isLoadingDecks
                              ? 'Loading...'
                              : fetchDecksError
                                ? 'Failed to load decks'
                                : 'No decks available'}
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
              onClick={handleClearAll}
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

        {(stage === 'uploading' || stage === 'processing') &&
          files.length > 0 && (
            <UploadProgress progress={displayProgress} stage={stage} />
          )}

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
      {toast.type && (
        <div className="fixed top-20 right-6 z-[60] pointer-events-none">
          <div
            className={`pointer-events-auto min-w-[280px] max-w-sm rounded-md border p-4 shadow-lg transition-opacity ${
              toast.type === 'error'
                ? 'bg-destructive/10 border-destructive text-destructive'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
