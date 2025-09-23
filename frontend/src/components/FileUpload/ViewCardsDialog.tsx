'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { FileCardData } from '@/types/card';
import CardWizard from './CardWizard';
import { Card as CardType } from '../../types/card';
interface ViewCardsDialogProps {
  fileCardData: FileCardData;
  deckName: string;
  deckId?: number;
  onConfirmUpload: (uploadedCards: CardType[]) => Promise<void>;
}

export default function ViewCardsDialog({
  fileCardData,
  deckName,
  deckId,
  onConfirmUpload,
}: ViewCardsDialogProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  if (!fileCardData || fileCardData.cards.length === 0) return null;

  const parsedCards = fileCardData.cards;
  const file = fileCardData.file;
  const cardCount = parsedCards.length;

  return (
    <>
      {/* Trigger Button */}
      <Button
        className="flex items-center gap-2 bg-black hover:bg-gray-700 text-white"
        onClick={() => setIsWizardOpen(true)}
      >
        <FileText className="h-4 w-4" />
        Create {cardCount} Cards
      </Button>

      {/* Card Wizard */}
      <CardWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        file={file}
        parsedCards={parsedCards}
        cardCount={cardCount}
        deckName={deckName}
        selectedDeckId={deckId ?? null}
        onConfirmUpload={async (cards) => {
          await onConfirmUpload(cards); // use the prop here
          setIsWizardOpen(false);
        }}
        progress={100}
        isUploading={false}
      />
    </>
  );
}
