import apiClient from './api-client';

export const getDecks = async (params = {}) => {
  try {
    const response = await apiClient.get('/decks', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    throw error;
  }
};

export const getDeckById = async (id: string | number) => {
  try {
    const response = await apiClient.get(`/decks/By/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch deck with id ${id}:`, error);
    throw error;
  }
};

export const createDeck = async (deckData: {
  title: string;
  description?: string;
  isPublic?: boolean;
}) => {
  try {
    const response = await apiClient.post('/decks', deckData);
    return response.data;
  } catch (error) {
    console.error('Failed to create deck:', error);
    throw error;
  }
};

export const updateDeck = async (
  id: string | number,
  deckData: { title?: string; description?: string; isPublic?: boolean }
) => {
  try {
    const response = await apiClient.patch(`/decks/${id}`, deckData);
    return response.data;
  } catch (error) {
    console.error(`Failed to update deck with id ${id}:`, error);
    throw error;
  }
};

export const deleteDeck = async (id: string | number) => {
  try {
    const response = await apiClient.delete(`/decks/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to delete deck with id ${id}:`, error);
    throw error;
  }
};
