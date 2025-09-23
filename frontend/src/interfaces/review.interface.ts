export interface DueCard {
  id: number;
  frontContent: string;
  backContent: string;
  aFactor: number;
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: string;
  isOverdue: boolean;
  overdueHours: number;
  deck: {
    title: string;
  };
}

export interface DueCardsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    cards: DueCard[];
    totalDue: number;
    hasMore: boolean;
    algorithm: string;
  };
  timestamp: string;
  path: string;
}

export interface SubmitReviewPayload {
  cardId: number;
  grade: number;
}

export interface SubmitReviewResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    success: boolean;
    // ... other properties from the response
  };
  timestamp: string;
  path: string;
}
