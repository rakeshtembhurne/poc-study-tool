'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteDeckDialogProps {
  deckId: string | number;
  deckTitle: string;
  cardCount?: number;
  onDelete?: (deckId: string | number) => void;
  trigger?: React.ReactNode;
}

export function DeleteDeckDialog({
  deckId,
  deckTitle,
  cardCount = 0,
  onDelete,
  trigger,
}: DeleteDeckDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // TODO: Replace with actual API call when backend is ready
      console.log('Deleting deck:', deckId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(deckId);
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Delete Deck
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-600 space-y-3">
            <p>
              Are you sure you want to delete{' '}
              <strong>{`"${deckTitle}"`}</strong>?
            </p>
            {cardCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  This deck contains <strong>{cardCount} cards</strong>. All
                  cards and study progress will be permanently lost.
                </p>
              </div>
            )}
            <p className="text-sm">
              This action cannot be undone. The deck and all associated data
              will be permanently removed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Deck
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
