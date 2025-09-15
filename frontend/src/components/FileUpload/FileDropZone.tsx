'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, X } from 'lucide-react';
import { FileValidationConfig } from '@/types/card';

interface FileDropZoneProps {
  file: File | null;
  isDragging: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onDragStateChange: (isDragging: boolean) => void;
  onError: (error: string | null) => void;
  validationConfig: FileValidationConfig;
}

export default function FileDropZone({
  file,
  isDragging,
  onFileSelect,
  onFileRemove,
  onDragStateChange,
  onError,
  validationConfig,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    const isAllowed =
      validationConfig.allowedTypes.includes(selectedFile.type) ||
      selectedFile.name.toLowerCase().endsWith('.txt') ||
      selectedFile.name.toLowerCase().endsWith('.pdf');

    if (!isAllowed) {
      return 'Only .txt or .pdf files are allowed.';
    }

    if (selectedFile.size > validationConfig.maxSize) {
      return 'File size must be less than 10 MB.';
    }

    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      const selectedFile = event.target.files[0];
      const validationError = validateFile(selectedFile);

      if (validationError) {
        onError(validationError);
      } else {
        onError(null); // Clear any previous errors
        onFileSelect(selectedFile);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDragStateChange(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      const validationError = validateFile(droppedFile);

      if (validationError) {
        onError(validationError);
      } else {
        onError(null); // Clear any previous errors
        onFileSelect(droppedFile);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDragStateChange(true);
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDragStateChange(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const relatedTarget = event.relatedTarget as Node | null;
    const currentTarget = event.currentTarget;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      onDragStateChange(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="deckName" className="text-sm font-medium text-foreground">
        Upload File (.txt or .pdf)
      </Label>

      <div
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-primary/70 bg-primary/5'
            : 'border-border bg-muted hover:bg-muted/70'
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div className="flex items-center gap-3">
            {!file ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    openFilePicker();
                  }}
                >
                  Choose File
                </Button>
                <span className="text-sm text-muted-foreground">
                  No file chosen
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onFileRemove();
                  }}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Select a .txt file with your cards
        </p>
        <p className="text-xs text-muted-foreground">
          Format: Question|Answer|Difficulty (one card per line)
        </p>
        <p className="text-xs text-muted-foreground/80">
          Example: What is 2+2?|4|Easy
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".txt,.pdf"
      />
    </div>
  );
}
