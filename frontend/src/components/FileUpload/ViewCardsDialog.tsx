'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import FilePreview from './FilePreview';
import { Card as CardType } from '@/types/card';

interface ViewCardsDialogProps {
  file: File | null;
  parsedCards: CardType[];
  cardCount: number;
}

export default function ViewCardsDialog({
  file,
  parsedCards,
  cardCount,
}: ViewCardsDialogProps) {
  if (!file || parsedCards.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
          <FileText className="h-4 w-4" />
          Create {cardCount} Cards
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preview {cardCount} Cards</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[70vh] overflow-y-auto">
          <FilePreview file={file} parsedCards={parsedCards} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
