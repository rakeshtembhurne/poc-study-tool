'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { FileCardData } from '@/types/card';
import CardWizard from './CardWizard';

interface ViewCardsDialogProps {
  fileCardData: FileCardData;
}

export default function ViewCardsDialog({
  fileCardData,
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
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
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
        deckName="My Deck"
        onConfirmUpload={async (cards) => {
          console.log('Confirmed cards:', cards);
          setIsWizardOpen(false);
        }}
        progress={100}
        isUploading={false}
      />
    </>
  );
}
