'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Sparkles, FileText, ChevronDown } from 'lucide-react';
import { Card as CardType } from '@/types/card';
import apiClient from '@/lib/api-client';
import CardWizard from './CardWizard';
import authStorage from '@/lib/auth-storage';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import { Textarea } from '../ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DeckData {
  id: number;
  title: string;
}
interface PromptInputProps {
  decks: DeckData[];
  loading: boolean;
  selectedDeckId: number | null;
  setSelectedDeckId: (id: number) => void;
}
export default function PromptInput({
  decks,
  loading,
  selectedDeckId,
  setSelectedDeckId,
}: PromptInputProps) {
  const [promptText, setPromptText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedCards, setParsedCards] = useState<CardType[]>([]);
  const [deckName, setDeckName] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [cardCount, setCardCount] = useState(0);

  const MAX_LENGTH = 2000;

  const handleGenerateCards = async () => {
    setError(null);
    setIsProcessing(true);

    // validate deck selection
    if (!selectedDeckId) {
      setError('Please select a deck before generating cards.');
      setIsProcessing(false);
      return;
    }

    const selectedDeck = decks.find((d) => d.id === selectedDeckId);

    // validate text input
    if (!promptText.trim()) {
      setError('Please enter some text to generate cards.');
      setIsProcessing(false);
      return;
    }

    try {
      const authToken = authStorage.getToken();
      if (!authToken) {
        setError('Authentication required. Please login again.');
        setIsProcessing(false);
        return;
      }

      const url = API_ENDPOINTS.v1.inputPrompt.generateCard;

      const response = await apiClient.post(
        url,
        {
          text: promptText,
          deckName: selectedDeck?.title, // ✅ use title here
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = response.data;
      console.log('Prompt generate response:', result);

      if (result.success) {
        const cards = result.data?.parsedFlashcards || [];

        setParsedCards(
          cards.map((card: any) => ({
            question: card.question,
            answer: card.answer,
            deckName: selectedDeck?.title || '', // ✅ use title here
            createdAt: new Date().toISOString(),
            difficulty: card.difficulty || 'Medium',
          }))
        );

        setCardCount(cards.length);
        setShowCards(true);
      } else {
        setError(
          result.message || 'Failed to generate cards. Please try again.'
        );
      }
    } catch (error: any) {
      // … keep your error handling
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Generate Cards with AI
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Deck Name */}
            <div className="mb-6">
              <Label className="text-gray-700 dark:text-gray-300">
                Choose an existing deck
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal mt-1"
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
            </div>

            {/* AI Prompt */}
            <div className="space-y-2">
              <Label htmlFor="aiPrompt">
                Enter Prompt (max {MAX_LENGTH} chars)
              </Label>
              <Textarea
                id="aiPrompt"
                placeholder="e.g. Generate 5 flashcards about React hooks"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                maxLength={MAX_LENGTH}
                rows={5} // optional, adjust height
              />
              <p className="text-sm text-muted-foreground">
                {promptText.length}/{MAX_LENGTH}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGenerateCards}
                disabled={isProcessing}
                className="flex-1 h-12 text-base font-medium"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isProcessing ? 'Generating...' : 'Generate Cards'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPromptText('');
                  setDeckName('');
                  setError(null);
                  setShowCards(false);
                  setParsedCards([]);
                  setCardCount(0);
                }}
              >
                Reset
              </Button>
            </div>

            {showCards && cardCount > 0 && (
              <div className="space-y-4 pt-4">
                <Button
                  className="flex items-center gap-2 bg-black hover:bg-gray-700 text-white"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  View {cardCount} Cards
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <CardWizard
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          file={null}
          parsedCards={parsedCards}
          deckName={decks.find((d) => d.id === selectedDeckId)?.title || ''}
          selectedDeckId={selectedDeckId}
          onConfirmUpload={async (cards) => {
            setIsDialogOpen(false);
            setParsedCards([]);
            setPromptText('');
            setCardCount(0);
            setSelectedDeckId(0);
          }}
          progress={100}
          isUploading={false}
          cardCount={parsedCards.length}
        />
        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
