'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { FileCardData } from '@/types/card';
import CardWizard from './CardWizard';

interface ViewCardsDialogProps {
  fileCardData: FileCardData;
  deckName: string;
}

export default function ViewCardsDialog({
  fileCardData,
  deckName,
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
