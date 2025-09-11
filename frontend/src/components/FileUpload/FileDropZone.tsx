'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { FileValidationConfig } from '@/types/card';

interface FileDropZoneProps {
  file: File | null;
  isDragging: boolean;
  onFileSelect: (file: File) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onError: (error: string | null) => void;
  validationConfig: FileValidationConfig;
}

export default function FileDropZone({
  file,
  isDragging,
  onFileSelect,
  onDragStateChange,
  onError,
  validationConfig,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    if (!validationConfig.allowedTypes.includes(selectedFile.type)) {
      return 'Only .txt files are allowed.';
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
      <Label className="text-sm font-medium text-gray-700">
        Upload File (.txt)
      </Label>

      {/* Drag and Drop Area */}
      <div
        onClick={openFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <FileText className="h-12 w-12 text-gray-400" />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="bg-white border-gray-300"
            >
              Choose File
            </Button>
            <span className="text-sm text-gray-500">
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-600">
          Select a .txt file with your cards
        </p>
        <p className="text-xs text-gray-500">
          Format: Question|Answer|Difficulty (one card per line)
        </p>
        <p className="text-xs text-gray-400">Example: What is 2+2?|4|Easy</p>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".txt"
      />
    </div>
  );
}
