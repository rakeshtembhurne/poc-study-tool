'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteDeckDialog } from '@/components/delete-deck-dialog';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDecks, deleteDeck } from '@/lib/deck-service';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Define the types for the deck data from the API
interface Deck {
  id: number;
  title: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user: {
    id: number;
    email: string;
  };
}

export default function DecksPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await getDecks();
      console.log('API Response for getDecks:', response);
      // The actual deck data is in response.data.data
      setDecks(response.data.deck || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch decks. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDeleteDeck = async (deckId: string | number) => {
    try {
      await deleteDeck(deckId);
      fetchDecks();
    } catch (error) {
      console.error('Failed to delete deck:', error);
    }
  };

  const handleEditDeck = (deckId: string | number) => {
    router.push(`/decks/edit?id=${deckId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">Error: {error}</div>;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-[80vw] mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Decks</h1>
              <p className="text-muted-foreground mt-1">
                Manage your flashcard collections
              </p>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm"
              onClick={() => router.push('/decks/add')}
            >
              + New Deck
            </Button>
          </div>

          {decks.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8 p-4 border border-dashed rounded-lg">
              <p className="text-lg font-semibold mb-2">No decks found.</p>
              <p>
                It looks like you haven&apos;t created any decks yet. Start by
                adding a new deck to organize your flashcards!
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <Card
                  key={deck.id}
                  className="bg-card border rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="p-6 flex flex-col h-full">
                    {/* Card Header */}
                    <CardHeader className="p-0 pb-5">
                      <div className="flex justify-between items-start mb-3">
                        <Badge
                          className={
                            deck.isPublic
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900'
                              : 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900'
                          }
                        >
                          {deck.isPublic ? 'Public' : 'Private'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleEditDeck(deck.id)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Deck
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <DeleteDeckDialog
                                deckId={deck.id}
                                deckTitle={deck.title}
                                onDelete={() => handleDeleteDeck(deck.id)}
                                trigger={
                                  <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer rounded-sm">
                                    <Trash2 className="w-4 h-4" />
                                    Delete Deck
                                  </div>
                                }
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-xl font-bold text-foreground mb-3 leading-tight line-clamp-2">
                            {deck.title}
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{deck.title}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {deck.description}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{deck.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </CardHeader>

                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="mt-auto">
                        <Button
                          size="sm"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-sm font-medium shadow-sm"
                          onClick={() => {
                            console.log('Study deck:', deck.id);
                          }}
                        >
                          Study Now
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
