'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, FileText } from 'lucide-react';
import { Card as CardType } from '@/types/card';
import apiClient from '@/lib/api-client';
import CardWizard from './CardWizard';

export default function PromptInput() {
  const [promptText, setPromptText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedCards, setParsedCards] = useState<CardType[]>([]);
  const [deckName, setDeckName] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [cardCount, setCardCount] = useState(0);

  const MAX_LENGTH = 1000;

  const handleGenerateCards = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/v1/prompt/generate', {
        text: promptText,
        deckName,
      });

      const data = response.data;

      if (data.success) {
        setParsedCards(data.data.cards || []);
        setCardCount(data.data.cards?.length || 0);
        setShowCards(true);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
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
              <Label htmlFor="deckName">Deck Name</Label>
              <Input
                id="deckName"
                placeholder="Enter name for the new deck..."
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
              />
            </div>

            {/* AI Prompt */}
            <div className="space-y-2">
              <Label htmlFor="aiPrompt">
                Enter Prompt (max {MAX_LENGTH} chars)
              </Label>
              <Input
                id="aiPrompt"
                placeholder="e.g. Generate 5 flashcards about React hooks"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                maxLength={MAX_LENGTH}
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
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
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
