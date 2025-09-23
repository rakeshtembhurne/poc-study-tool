'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card as CardType } from '@/types/card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { API_ENDPOINTS } from '@/utils/apiEndpoints';
import apiClient from '@/lib/api-client';
import authStorage from '@/lib/auth-storage';
import { toast } from 'sonner';

interface CardWizardProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  parsedCards: CardType[];
  deckName: string;
  selectedDeckId: number | null; // <-- add this

  onConfirmUpload: (cards: CardType[]) => Promise<void>;
  progress: number;
  isUploading: boolean;
  cardCount: number;
}

export default function CardWizard({
  isOpen,
  onClose,
  parsedCards = [],
  deckName,
  selectedDeckId,
  onConfirmUpload,
}: CardWizardProps) {
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setSelectedCards(parsedCards);
      setStep(1);
    }
  }, [isOpen, parsedCards]);

  const toggleCard = (card: CardType) => {
    setSelectedCards((prev) =>
      prev.some((c) => c.question === card.question && c.answer === card.answer)
        ? prev.filter(
            (c) => !(c.question === card.question && c.answer === card.answer)
          )
        : [...prev, card]
    );
  };

  const handleSave = async () => {
    if (!selectedDeckId) {
      toast.error('No deck selected');
      return;
    }

    if (!selectedCards || selectedCards.length === 0) {
      // <- use selectedCards
      toast.error('No cards selected to upload');
      return;
    }

    const authToken = authStorage.getToken();
    if (!authToken) {
      toast.error('User not authenticated');
      return;
    }

    const payload = {
      deckId: selectedDeckId,
      flashcards: selectedCards.map((card) => ({
        // <- use selectedCards
        question: card.question,
        answer: card.answer,
        tags: card.tags || [],
      })),
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS.v1.flashcards.cardbulk,
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = response.data;
      if (result.success) {
        toast.success('Cards uploaded successfully!');
        await onConfirmUpload(selectedCards);
        onClose(); // close wizard
      } else {
        toast.error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      toast.error('Upload Error. Please try again.');
      console.error('Upload Error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl min-h-[40vh] flex flex-col bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && `Step 1: Select Cards for ${deckName}`}
            {step === 2 && `Step 2: Review Selected Cards`}
            {step === 3 && `Step 3: Confirm Upload`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* STEP 1 → Select Cards */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {parsedCards.length > 0 ? (
                parsedCards.map((card, index) => {
                  const isSelected = selectedCards.some(
                    (c) =>
                      c.question === card.question && c.answer === card.answer
                  );
                  return (
                    <Card
                      key={index}
                      className={`cursor-pointer border-2 transition ${
                        isSelected
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleCard(card)}
                    >
                      <CardHeader className="font-semibold text-sm line-clamp-2">
                        Q: {card.question}
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-card-foreground line-clamp-3">
                          A: {card.answer}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          Difficulty: {card.difficulty}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-muted-foreground col-span-3 text-center">
                  No cards available. Please generate some first.
                </p>
              )}
            </div>
          )}

          {/* STEP 2 → Show only selected cards */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {selectedCards.length > 0 ? (
                selectedCards.map((card, index) => (
                  <Card
                    key={index}
                    className="border-2 border-blue-500 bg-card bg-gray-200"
                  >
                    <CardHeader className="font-semibold text-sm line-clamp-2">
                      Q: {card.question}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-card-foreground line-clamp-3">
                        A: {card.answer}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Difficulty: {card.difficulty}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground col-span-3 text-center">
                  No cards selected. Please go back and choose at least one.
                </p>
              )}
            </div>
          )}

          {/* STEP 3 → Confirmation */}
          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center items-center space-y-6">
              <p className="text-lg font-medium text-center">
                You are about to upload{' '}
                <span className="font-bold text-primary">
                  {selectedCards.length}
                </span>{' '}
                cards to deck{' '}
                <span className="italic">&quot;{deckName}&quot;</span>.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Once uploaded, these cards will be permanently saved to your
                deck.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/80"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && selectedCards.length === 0}
            >
              Next
            </Button>
          ) : (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/80"
              onClick={handleSave}
              disabled={selectedCards.length === 0}
            >
              Confirm & Save
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
