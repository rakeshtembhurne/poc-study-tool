import apiClient from './api-client';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import {
  DueCardsResponse,
  SubmitReviewPayload,
  SubmitReviewResponse,
} from '@/interfaces/review.interface';

export const getDueCards = async (): Promise<DueCardsResponse> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.v1.review.due);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch due cards:', error);
    throw error;
  }
};

export const submitReview = async (
  payload: SubmitReviewPayload
): Promise<SubmitReviewResponse> => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.v1.review.submit,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Failed to submit review:', error);
    throw error;
  }
};
