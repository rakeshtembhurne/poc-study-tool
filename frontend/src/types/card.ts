export interface Card {
  question: string;
  answer: string;
  difficulty: string;
}

export interface FileUploadState {
  file: File | null;
  error: string | null;
  isDragging: boolean;
  progress: number;
  isUploading: boolean;
  parsedCards: Card[];
  deckName: string;
  cardCount: number;
}

export type CreationMethod = 'manual' | 'file';

export interface FileValidationConfig {
  allowedTypes: string[];
  maxSize: number;
}
