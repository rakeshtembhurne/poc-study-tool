import apiClient from './api-client';

interface CardPayload {
  frontContent: string;
  backContent: string;
  deckId: number;
  userId: number;
}

// Create a new card
export const createCard = async (cardData: CardPayload) => {
  try {
    const response = await apiClient.post('/cards', cardData);
    return response.data;
  } catch (error) {
    console.error('Failed to create card:', error);
    throw error;
  }
};

// Update an existing card
export const updateCard = async (
  id: number,
  cardData: Partial<CardPayload>
) => {
  try {
    const response = await apiClient.put(`/cards/${id}`, cardData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update card with id ${id}:`, error);
    throw error;
  }
};

// Delete a card
export const deleteCard = async (id: number) => {
  try {
    const response = await apiClient.delete(`/cards/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete card with id ${id}:`, error);
    throw error;
  }
};

// Get all cards for a specific user with pagination and optional deckId
export const getCardsByUserId = async (
  page: number = 1,
  limit: number = 4,
  deckId?: number
) => {
  try {
    const params: { page: number; limit: number; deckId?: number } = {
      page,
      limit,
    };
    if (deckId) {
      params.deckId = deckId;
    }
    const response = await apiClient.get('/cards', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all cards:', error);
    throw error;
  }
};

// Get all cards for a specific deck (this function might be redundant if getCardsByUserId handles deckId)
export const getCardsByDeckId = async (
  deckId: number,
  page: number = 1,
  limit: number = 10,
  search?: string
) => {
  try {
    const response = await apiClient.get(`/cards`, {
      params: { page, limit, search, deckId },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch cards for deck with id ${deckId}:`, error);
    throw error;
  }
};
