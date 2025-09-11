'use client';

import { FileText } from 'lucide-react';
import { Card } from '@/types/card';

interface FilePreviewProps {
  file: File | null;
  parsedCards: Card[];
}

export default function FilePreview({ file, parsedCards }: FilePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  if (!file) return null;

  return (
    <div className="space-y-4">
      {/* File Details */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{file.name}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          File size: {formatFileSize(file.size)}
        </div>
      </div>

      {/* Preview Cards */}
      {parsedCards.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">
            Preview ({parsedCards.length} cards found)
          </h3>
          <div className="max-h-80 overflow-y-auto border rounded-lg bg-white">
            {parsedCards.slice(0, 5).map((card, index) => (
              <div
                key={index}
                className={`p-4 text-sm ${
                  index !== parsedCards.length - 1 && index !== 4
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">
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
                <div className="text-gray-600">A: {card.answer}</div>
              </div>
            ))}
            {parsedCards.length > 5 && (
              <div className="text-center text-sm text-gray-500 py-3 border-t border-gray-100">
                ... and {parsedCards.length - 5} more cards
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
