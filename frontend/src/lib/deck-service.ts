import { toast } from 'sonner';
import apiClient from './api-client';

export const getDecks = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/v1/decks', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    throw error;
  }
};

export const getDeckById = async (id: string | number) => {
  try {
    const response = await apiClient.get(`/api/v1/decks/By/${id}`);
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
    const response = await apiClient.post('/api/v1/decks', deckData);
    toast.success(response.data.message || 'Deck created successfully!');
    return response.data;
  } catch (error: any) {
    console.error('Failed to create deck:', error);
    toast.error(error.response?.data?.message || 'Failed to create deck.');
    throw error;
  }
};

export const updateDeck = async (
  id: string | number,
  deckData: { title?: string; description?: string; isPublic?: boolean }
) => {
  try {
    const response = await apiClient.patch(`/api/v1/decks/${id}`, deckData);
    toast.success(response.data.message || 'Deck updated successfully!');
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update deck with id ${id}:`, error);
    toast.error(error.response?.data?.message || 'Failed to update deck.');
    throw error;
  }
};

export const deleteDeck = async (id: string | number) => {
  try {
    const response = await apiClient.delete(`/api/v1/decks/${id}`);
    toast.success(response.data.data.message || 'Deck deleted successfully!');
    return response.data;
  } catch (error: any) {
    console.error(`Failed to delete deck with id ${id}:`, error);
    toast.error(error.response?.data?.message || 'Failed to delete deck.');
    throw error;
  }
};
