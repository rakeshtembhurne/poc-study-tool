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

interface CardWizardProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  parsedCards: CardType[];
  deckName: string;
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

  const handleSave = () => {
    onConfirmUpload(selectedCards);
    onClose();
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

        {/* STEP 1 → Select Cards */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto">
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
                        ? 'border-green-400 bg-card'
                        : 'border-blue-400 hover:border-blue-400'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto">
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
          <div className="flex flex-col justify-center items-center flex-1 space-y-6">
            <p className="text-lg font-medium text-center">
              You are about to upload{' '}
              <span className="font-bold text-primary">
                {selectedCards.length}
              </span>{' '}
              cards to deck{' '}
              <span className="italic">&quot;{deckName}&quot;</span>.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Once uploaded, these cards will be permanently saved to your deck.
            </p>
          </div>
        )}

        {/* Wizard Navigation */}
        <div className="flex justify-between">
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
