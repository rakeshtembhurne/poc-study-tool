'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Pencil, Trash2, X } from 'lucide-react';
import { getDecks } from '@/lib/deck-service';
import { getCardsByUserId, deleteCard, updateCard } from '@/lib/card-service';
import Link from 'next/link';

interface DeckData {
  id: number;
  title: string;
}

interface CardData {
  id: number;
  frontContent: string;
  backContent: string;
  difficulty: string;
  deckId: number;
  tags?: string;
  userId: number;
  deck?: {
    id: number;
    title: string;
  };
}

const CARDS_PER_PAGE = 8;
const MAX_QUESTION_LENGTH = 150;
const MAX_ANSWER_LENGTH = 300;

export default function ViewCards() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckData[]>([]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editDeckId, setEditDeckId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchDecks = async () => {
    try {
      const response = await getDecks();
      setDecks(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch decks:', err);
    }
  };

  const fetchCardsWithPagination = async (newPage: number) => {
    try {
      setLoading(true);
      const response = await getCardsByUserId(
        newPage,
        CARDS_PER_PAGE,
        selectedDeckId || undefined
      );
      setCards(response.data.data || []);
      setTotalPages(response.data.meta.totalPages);
      setPage(newPage);
      setError(null);
    } catch (err) {
      setError('Failed to fetch cards. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
    fetchCardsWithPagination(page);
  }, []);

  useEffect(() => {
    fetchCardsWithPagination(1);
  }, [selectedDeckId]);

  const handleDelete = async (id: number) => {
    try {
      await deleteCard(id);
      // Re-fetch cards after deletion
      fetchCardsWithPagination(page);
    } catch (err) {
      setError('Failed to delete card. Please try again.');
      console.error(err);
    }
  };

  const openEditModal = (card: CardData) => {
    setEditingCard(card);
    setEditQuestion(card.frontContent || '');
    setEditAnswer(card.backContent || '');
    setEditDeckId(card.deckId || null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCard(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditDeckId(null);
  };

  const handleEditSave = async () => {
    if (
      !editQuestion.trim() ||
      !editAnswer.trim() ||
      editDeckId === null ||
      !editingCard
    ) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      setEditLoading(true);
      const updatedCardPayload = {
        frontContent: editQuestion,
        backContent: editAnswer,
        deckId: editDeckId,
      };

      await updateCard(editingCard.id, updatedCardPayload);

      // Update the card in the local state
      const updatedCards = cards.map((card) =>
        card.id === editingCard.id
          ? {
              ...card,
              frontContent: editQuestion,
              backContent: editAnswer,
              deckId: editDeckId,
            }
          : card
      );
      setCards(updatedCards);

      closeEditModal();
    } catch (err) {
      setError('Failed to update card. Please try again.');
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Your Flashcards
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage all your flashcards in one place
            </p>
          </div>
          <Link href="/create-card">
            <Button>Create New Card</Button>
          </Link>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Filter by Deck
          </h2>
          <div className="space-y-2">
            <select
              value={selectedDeckId || ''}
              onChange={(e) =>
                setSelectedDeckId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">All Decks</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-10">
            Loading cards...
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500 dark:text-gray-400">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">No flashcards found.</p>
            <p className="mt-2">Create your first flashcard to get started!</p>
            <Link href="/create-card" className="mt-4">
              <Button>Create New Card</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cards.map((card) => (
                <Card key={card.id} className="rounded-lg shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 break-words">
                      {card.frontContent}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-2 break-words">
                      {card.backContent}
                    </p>
                    {card.deck && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Deck: {card.deck.title}
                      </div>
                    )}
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditModal(card)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center mt-8 space-x-4">
              <Button
                variant="outline"
                onClick={() => fetchCardsWithPagination(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-gray-600 dark:text-gray-400 self-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchCardsWithPagination(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Edit Card
                </h2>
                <Button variant="ghost" size="icon" onClick={closeEditModal}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-question"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Question
                  </Label>
                  <Input
                    id="edit-question"
                    placeholder="Enter your question..."
                    value={editQuestion || ''}
                    onChange={(e) =>
                      setEditQuestion(
                        e.target.value.slice(0, MAX_QUESTION_LENGTH)
                      )
                    }
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
                    {editQuestion?.length || 0}/{MAX_QUESTION_LENGTH}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-answer"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Answer
                  </Label>
                  <Textarea
                    id="edit-answer"
                    placeholder="Enter the answer..."
                    value={editAnswer || ''}
                    onChange={(e) =>
                      setEditAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))
                    }
                    className="resize-none"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
                    {editAnswer?.length || 0}/{MAX_ANSWER_LENGTH}
                  </span>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-deck"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Select Deck
                  </Label>
                  <select
                    id="edit-deck"
                    value={editDeckId || ''}
                    onChange={(e) => setEditDeckId(Number(e.target.value))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
                  >
                    <option value="">Choose a deck...</option>
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={closeEditModal}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditSave} disabled={editLoading}>
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
