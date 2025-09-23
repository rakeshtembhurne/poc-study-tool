export interface Card {
  question: string;
  answer: string;
  difficulty?: string;
  deckName?: string;
  createdAt?: string;
  tags?: string[];
}

export interface FileUploadState {
  files: File[];
  error: string | null;
  isDragging: boolean;
  progress: number;
  isUploading: boolean;
  parsedCards: Card[];
  deckName: string;
  cardCount: number;
}

export interface FileCardData {
  file: File;
  cards: Card[];
  error?: string;
}

export type CreationMethod = 'manual' | 'file' | 'prompt';

export interface FileValidationConfig {
  allowedTypes: string[];
  maxSize: number;
}
