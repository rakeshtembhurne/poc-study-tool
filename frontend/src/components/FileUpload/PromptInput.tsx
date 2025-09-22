'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, FileText } from 'lucide-react';
import { Card as CardType } from '@/types/card';
import apiClient from '@/lib/api-client';
import CardWizard from './CardWizard';
import authStorage from '@/lib/auth-storage';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import { Textarea } from '../ui/textarea';

interface PromptInputProps {
  decks: string[];
}

export default function PromptInput({ decks }: PromptInputProps) {
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
    if (!deckName) {
      setError('Please select a deck before generating cards.');
      setIsProcessing(false);
      return;
    }

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
          deckName: deckName,
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
            deckName: deckName,
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
      console.error('Generate cards error:', error);

      let errorMessage = 'An unexpected error occurred while generating cards.';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.message || 'Invalid request format.';
            break;
          case 401:
            errorMessage = 'Session expired. Please login again.';
            authStorage.removeToken();
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission.';
            break;
          case 404:
            errorMessage = 'Prompt service not found. Please contact support.';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage =
              data?.message ||
              `Failed to generate cards (${status}). Please try again.`;
        }
      } else if (error.request) {
        errorMessage =
          'Unable to connect to server. Please check your internet.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      }

      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Create Card (AI Prompt)</h1>
          </div>
        </div>
      </div>

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
            <div className="space-y-2">
              <Label htmlFor="deckName">Select Deck</Label>
              <select
                id="deckName"
                className="w-full border rounded-md p-2 bg-background text-foreground"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
              >
                <option value="">Select a deck...</option>
                {decks.map((deck, idx) => (
                  <option key={idx} value={deck}>
                    {deck}
                  </option>
                ))}
              </select>
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

        {/* Card Preview Popup */}
        <CardWizard
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          file={null}
          parsedCards={parsedCards}
          deckName={deckName}
          onConfirmUpload={async () => setIsDialogOpen(false)}
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
