export interface CardUploadRequestBody {
  files: File[];
  description?: string;
  deckName?: string;
}

export interface CardUploadResponse {
  success: boolean;
  message: string;
  data?: {
    files: BackendFileResponse[];
    totalCards: number;
    deckName: string;
  };
  error?: string;
}

export interface BackendFileResponse {
  id: string;
  filename: string;
  flashcards?: {
    totalCards: number;
    parsedFlashcards: Array<{
      question: string;
      answer: string;
      difficulty?: string;
    }>;
  };
  message?: string;
  error?: string;
}

export interface CardApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
