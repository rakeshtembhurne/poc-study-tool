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
import { Upload, ArrowLeft, Edit, FileText, ChevronDown } from 'lucide-react';
import {
  Card as CardType,
  FileValidationConfig,
  CreationMethod,
  FileCardData,
} from '@/types/card';
import FileDropZone from './FileDropZone';
import UploadProgress from './UploadProgress';
import ViewCardsDialog from './ViewCardsDialog';
import authStorage from '@/lib/auth-storage';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
// import { log } from 'console';

// Deck interface (for API response typing)
interface Deck {
  id: number;
  title: string;
  description?: string;
  isPublic: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

// Yup validation schema
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
  const [creationMethod, setCreationMethod] = useState<CreationMethod>('file');
  const [totalCardCount, setTotalCardCount] = useState<number>(0);
  const [decks, setDecks] = useState<string[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState<boolean>(false);
  const [selectedDeck, setSelectedDeck] = useState<string>('');

  // Initialize form with Yup resolver
  const form = useForm<DeckFormData>({
    resolver: yupResolver(deckFormSchema),
    defaultValues: {
      deckName: '',
    },
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCards, setShowCards] = useState<boolean>(false);

  // Fetch existing decks with comprehensive error handling
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
      console.log('Fetch decks response result:', result);

      if (result.success) {
        console.log('Decks fetched successfully!');
        const decksArray = result.data?.data || [];

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
      console.error('Fetch decks error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred while fetching decks.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid request format.';
            break;
          case 401:
            errorMessage =
              'Session expired. Please login again to view your decks.';
            // Clear invalid token
            authStorage.removeToken();
            break;
          case 403:
            errorMessage =
              'Access denied. You do not have permission to view decks.';
            break;
          case 404:
            errorMessage = 'Deck service not found. Please contact support.';
            break;
          case 429:
            errorMessage =
              'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message ||
              `Failed to fetch decks (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Authentication error. Please login again.';
        authStorage.removeToken();
      }

      setFetchDecksError(errorMessage);
    } finally {
      setIsLoadingDecks(false);
    }
  };

  // Load decks on component mount
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
    allowedTypes: ['text/plain', 'application/pdf'], // allow .pdf
    maxSize: 10 * 1024 * 1024,
  };

  // parseFileContent function removed as we now use backend API for processing

  const handleUpload = async () => {
    if (files.length === 0) return;

    // Get the current form values
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
      // Get auth token first
      const authToken = authStorage.getToken();
      if (!authToken) {
        setUploadError(
          'Authentication required. Please login to upload files.'
        );
        setIsUploading(false);
        return;
      }

      // Create FormData for API call
      const formData = new FormData();

      // Add files to FormData (backend expects 'files' field name)
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Note: deckName removed - we're selecting existing decks, not creating new ones

      // Call backend API using the new endpoint
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
      console.log('Upload response result:', result);

      if (result.success) {
        console.log('Files uploaded successfully!');

        // Transform backend response to match frontend expectations
        const backendFiles = result.data || [];
        const newFileCardData: FileCardData[] = [];
        const allCards: CardType[] = [];

        // Process each file response from backend
        backendFiles.forEach((backendFile: any, index: number) => {
          const originalFile = files[index];
          const cards: CardType[] = [];
          let fileError: string | undefined;

          // Check if flashcard generation was successful
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
          } else if (backendFile.flashcardGenerationStatus === 'failed') {
            fileError =
              backendFile.flashcardError ||
              'Failed to generate cards from file';
          } else {
            fileError = 'No cards generated from file';
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

        // Complete progress and show results
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
      console.error('Upload error:', error);

      // Handle different types of errors
      let errorMessage = 'An unexpected error occurred during upload.';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid file format or request.';
            break;
          case 401:
            errorMessage =
              'Session expired. Please login again to upload files.';
            // Clear invalid token
            authStorage.removeToken();
            break;
          case 403:
            errorMessage =
              'Access denied. You do not have permission to upload files.';
            break;
          case 404:
            errorMessage = 'Upload service not found. Please contact support.';
            break;
          case 413:
            errorMessage =
              'File size too large. Please reduce file size and try again.';
            break;
          case 415:
            errorMessage =
              'Unsupported file type. Please upload PDF or TXT files only.';
            break;
          case 429:
            errorMessage =
              'Too many upload requests. Please wait a moment and try again.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message || `Upload failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage =
          'Unable to connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage = 'Upload timed out. Please try again with smaller files.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Authentication error. Please login again.';
        authStorage.removeToken();
      }

      setUploadError(errorMessage);
      setIsUploading(false);
      setProgress(0);
    }
  };

  // Remove simulateProgress function as we now use real upload progress

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
              {/* Deck Selection Form */}
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

                            <DropdownMenuContent className="w-full">
                              {Array.isArray(decks) && decks.length > 0 ? (
                                decks.map((title, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={() => {
                                      setSelectedDeck(title);
                                      field.onChange(title);
                                    }}
                                  >
                                    {title}
                                  </DropdownMenuItem>
                                ))
                              ) : (
                                <DropdownMenuItem disabled>
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
