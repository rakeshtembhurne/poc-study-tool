'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import FilePreview from './FilePreview';
import { FileCardData } from '@/types/card';

interface ViewCardsDialogProps {
  fileCardData: FileCardData;
}

export default function ViewCardsDialog({
  fileCardData,
}: ViewCardsDialogProps) {
  if (!fileCardData || fileCardData.cards.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="flex items-center gap-2 px-6 py-3 !cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create {fileCardData.cards.length} Cards
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] bg-background">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Card Preview & Creation
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Review {fileCardData.cards.length} cards from{' '}
            {fileCardData.file.name} before creating them
          </p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <FilePreview fileCardData={[fileCardData]} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" className="!cursor-pointer">
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex items-center gap-2 !cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Create All Cards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
