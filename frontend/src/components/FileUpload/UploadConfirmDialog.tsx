'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card as CardType } from '@/types/card';
import { Upload, X, RefreshCw } from 'lucide-react';
import UploadProgress from './UploadProgress';

interface UploadConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  parsedCards: CardType[];
  deckName: string;
  onConfirmUpload: () => void;
  onRetry: () => void; // 🔹 new
  progress: number;
  isUploading: boolean;
  uploadError: string | null; // 🔹 new
}

export default function UploadConfirmDialog({
  isOpen,
  onClose,
  file,
  parsedCards,
  onConfirmUpload,
  onRetry,
  progress,
  isUploading,
  uploadError,
}: UploadConfirmDialogProps) {
  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Confirm Upload
          </DialogTitle>
          <DialogDescription>
            Review your file details and confirm the upload to create your deck.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {parsedCards.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">
                Card Preview ({parsedCards.length} cards)
              </h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
                {parsedCards.slice(0, 3).map((card, index) => (
                  <div
                    key={index}
                    className={`p-3 text-sm ${
                      index !== 2 && index !== parsedCards.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900 text-xs">
                        Q: {card.question}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          card.difficulty.toLowerCase() === 'easy'
                            ? 'bg-green-100 text-green-700'
                            : card.difficulty.toLowerCase() === 'hard'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {card.difficulty}
                      </span>
                    </div>
                    <div className="text-gray-600 text-xs">
                      A: {card.answer}
                    </div>
                  </div>
                ))}
                {parsedCards.length > 3 && (
                  <div className="text-center text-sm text-gray-500 py-3 border-t border-gray-100">
                    ... and {parsedCards.length - 3} more cards
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          <UploadProgress progress={progress} isUploading={isUploading} />

          {/* Error Message + Retry */}
          {uploadError && (
            <div className="text-red-600 text-sm font-medium">
              {uploadError}
              <div className="mt-2">
                <Button
                  onClick={onRetry}
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Upload
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={onConfirmUpload}
            disabled={isUploading || parsedCards.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Creating...' : `Create ${parsedCards.length} Cards`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
