'use client';

import { useRef, useState, useEffect } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronDown, Upload } from 'lucide-react';
import apiClient from '@/lib/api-client';
import authStorage from '@/lib/auth-storage';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';

interface Deck {
  id: string;
  title: string;
}

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedTypes = ['application/pdf', 'text/plain'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = authStorage.getToken();
      if (!authToken) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      const url = API_ENDPOINTS.v1.decks.fetch;
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const result = response.data;
      if (result.success && result.data && Array.isArray(result.data.deck)) {
        setDecks(result.data.deck);
      } else {
        setError(
          result.message || 'No decks found or data in unexpected format.'
        );
        setDecks([]);
      }
    } catch (err: any) {
      console.error('Fetch decks error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred while fetching decks.';
      setError(errorMessage);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDecks();
  }, []);

  const validateFile = (selectedFile: File) => {
    if (!allowedTypes.includes(selectedFile.type)) {
      return 'Only .pdf and .txt files are allowed.';
    }
    if (selectedFile.size > maxSize) {
      return 'File size must be less than 10 MB.';
    }
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const selectedFile = event.target.files[0];
      const validationError = validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        setPreviewContent(null);
      } else {
        setError(null);
        setFile(selectedFile);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      const droppedFile = event.dataTransfer.files[0];
      const validationError = validateFile(droppedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        setPreviewContent(null);
      } else {
        setError(null);
        setFile(droppedFile);
      }

      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a valid file first!');
      return;
    }
    if (!selectedDeckId) {
      setError('Please select a deck first!');
      return;
    }

    setProgress(0);
    setError(null);
    setIsUploading(true);
    setPreviewContent(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('deckId', selectedDeckId);

    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded! * 100) / progressEvent.total
            );
            setProgress(percent);
          }
        },
      });
      setPreviewContent(res.data.content || 'No content extracted');
      setFile(null);
      setProgress(0);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground">
      <h3 className="text-xl font-semibold mb-4">Upload a File</h3>

      <div className="mb-6">
        <Label className="text-gray-700 dark:text-gray-300">
          Choose an existing deck
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between text-left font-normal mt-1"
              disabled={loading}
            >
              {selectedDeckId
                ? decks.find((d) => d.id === selectedDeckId)?.title
                : 'Choose a deck...'}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-none z-50"
            align="start"
            sideOffset={4}
          >
            {loading ? (
              <DropdownMenuItem disabled className="w-full">
                Loading...
              </DropdownMenuItem>
            ) : decks.length > 0 ? (
              decks.map((deck) => (
                <DropdownMenuItem
                  key={deck.id}
                  className="w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                  onClick={() => {
                    setSelectedDeckId(deck.id);
                  }}
                >
                  <span className="truncate">{deck.title}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="w-full">
                No decks found.
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 dashed rounded-lg p-8 text-center cursor-pointer mb-4 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        {file ? (
          <p className="mt-2">Selected File: {file.name}</p>
        ) : (
          <p className="mt-2">
            Drag & Drop a file (max 10MB), or click to choose
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 text-red-500 text-sm">
          <p>{error}</p>
        </div>
      )}

      {progress > 0 && (
        <div className="my-4">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-sm mt-1">{progress}%</p>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.txt"
      />

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={openFilePicker}
          disabled={isUploading}
          className="flex-1"
        >
          Choose File
        </Button>

        <Button
          onClick={handleUpload}
          disabled={!file || !selectedDeckId || isUploading}
          className="flex-1"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>

      {previewContent && (
        <div className="mt-6 p-4 border rounded-lg bg-muted/50 max-h-72 overflow-y-auto">
          <h4 className="font-semibold mb-2">Content Preview:</h4>
          <p className="text-sm whitespace-pre-wrap">{previewContent}</p>
        </div>
      )}
    </div>
  );
}
