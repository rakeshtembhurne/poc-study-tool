export type FileValidationConfig = {
  maxSize: number;
  allowedTypes: string[];
};

export type CreationMethod = 'file' | 'manual' | 'ai' | 'prompt';
export interface Card {
  question: string;
  answer: string;
  difficulty?: string;
  deckName?: string;
  createdAt?: string;
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
