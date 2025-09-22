'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCard } from '@/lib/card-service';
import FileUpload from '@/components/FileUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import authStorage from '@/lib/auth-storage';

interface DeckData {
  id: number;
  title: string;
}

const MAX_QUESTION_LENGTH = 150;
const MAX_ANSWER_LENGTH = 300;

export default function CreateNewCard() {
  const router = useRouter();
  const [creationMethod, setCreationMethod] = useState('Manual Form');
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckData[]>([]);

  const fetchDecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = authStorage.getToken();
      if (!authToken) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      const url = API_ENDPOINTS.v1.decks.fetch;
      const response = await apiClient.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const result = response.data;
      if (result.success && result.data && Array.isArray(result.data.deck)) {
        setDecks(result.data.deck);
      } else {
        setError(
          result.message || 'No decks found or data in unexpected format.'
        );
        setDecks([]);
      }
    } catch (err: any) {
      console.error('Fetch decks error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred while fetching decks.';
      setError(errorMessage);
      setDecks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const isValidInput = (input: string) => {
    return input.trim().length > 0;
  };

  const handleManualSave = async () => {
    if (
      !isValidInput(question) ||
      !isValidInput(answer) ||
      selectedDeckId === null
    ) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const newCardPayload = {
      frontContent: question,
      backContent: answer,
      deckId: selectedDeckId,
    };

    try {
      await createCard(newCardPayload);
      setQuestion('');
      setAnswer('');
      toast.success('Card created successfully!');
      router.push('/cards');
    } catch (err) {
      toast.error('Failed to save card. Please try again.');
      console.error(err);
    }
  };

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="max-w-3xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Create New Card
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add flashcards to your collection
          </p>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Choose Creation Method
            </h2>
            <div className="flex gap-4">
              <Button
                variant={
                  creationMethod === 'Manual Form' ? 'default' : 'outline'
                }
                onClick={() => {
                  setCreationMethod('Manual Form');
                }}
                className="flex-1 py-4 px-4"
              >
                Manual Form
              </Button>
              <Button
                variant={
                  creationMethod === 'File Upload' ? 'default' : 'outline'
                }
                onClick={() => {
                  setCreationMethod('File Upload');
                }}
                className="flex-1 py-4 px-4"
              >
                File Upload
              </Button>
            </div>
          </div>

          {creationMethod === 'Manual Form' && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Manual Card Creation
              </h2>
              <div className="mb-8">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    Choose an existing deck
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                        disabled={loading}
                      >
                        {selectedDeckId
                          ? decks.find((d) => d.id === selectedDeckId)?.title
                          : 'Choose a deck...'}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-none z-50"
                      align="start"
                      sideOffset={4}
                    >
                      {loading ? (
                        <DropdownMenuItem disabled className="w-full">
                          Loading...
                        </DropdownMenuItem>
                      ) : decks.length > 0 ? (
                        decks.map((deck) => (
                          <DropdownMenuItem
                            key={deck.id}
                            className="w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                            onClick={() => {
                              setSelectedDeckId(deck.id);
                            }}
                          >
                            <span className="truncate">{deck.title}</span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled className="w-full">
                          No decks found.
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="question"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Question
                  </Label>
                  <Input
                    id="question"
                    placeholder="Enter your question..."
                    value={question}
                    onChange={(e) =>
                      setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))
                    }
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
                    {question.length}/{MAX_QUESTION_LENGTH}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="answer"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Answer
                  </Label>
                  <Textarea
                    id="answer"
                    placeholder="Enter the answer..."
                    value={answer}
                    onChange={(e) =>
                      setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))
                    }
                    className="resize-none"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
                    {answer.length}/{MAX_ANSWER_LENGTH}
                  </span>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleManualSave}
                    disabled={selectedDeckId === null || loading}
                  >
                    Save Card
                  </Button>
                </div>
              </div>
            </div>
          )}

          {creationMethod === 'File Upload' && <FileUpload />}

          <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              <span className="text-yellow-500 mr-2">💡</span>Instructions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong className="text-gray-800 dark:text-gray-200">
                Manual Form:
              </strong>{' '}
              Create cards one by one using the form above.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong className="text-gray-800 dark:text-gray-200">
                File Upload:
              </strong>{' '}
              Upload a .txt file with multiple cards at once.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <strong className="text-gray-800 dark:text-gray-200">
                File Format:
              </strong>{' '}
              Each line should contain: Question|Answer
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              <strong className="text-gray-800 dark:text-gray-200">
                Example file contents:
              </strong>
            </p>
            <pre className="mt-2 text-xs border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              What is the capital of France?|Paris How do you say hello in
              Spanish?|Hola What is 15 x 12?|180
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
