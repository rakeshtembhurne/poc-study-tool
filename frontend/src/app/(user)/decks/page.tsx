'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DeleteDeckDialog } from '@/components/delete-deck-dialog';
import { useRouter } from 'next/navigation';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const decks = [
  {
    id: 1,
    title: 'Spanish Vocabulary',
    description: 'Common Spanish words and phrases',
    category: 'Language',
    due: 5,
    cards: 45,
    progress: 78,
    lastStudied: '2 hours ago',
  },
  {
    id: 2,
    title: 'Programming Concepts',
    description: 'Data structures, algorithms, and programming principles',
    category: 'Technology',
    due: 3,
    cards: 67,
    progress: 92,
    lastStudied: '1 day ago',
  },
  {
    id: 3,
    title: 'History Facts',
    description: 'Important historical events and dates',
    category: 'Education',
    due: 15,
    cards: 89,
    progress: 45,
    lastStudied: '3 days ago',
  },
  {
    id: 4,
    title: 'Medical Terms',
    description: 'Medical terminology and definitions',
    category: 'Medicine',
    due: 23,
    cards: 156,
    progress: 67,
    lastStudied: '5 days ago',
  },
];

const getCategoryColor = (category: string) => {
  const colors = {
    Language: 'bg-blue-100 text-blue-800',
    Technology: 'bg-green-100 text-green-800',
    Education: 'bg-purple-100 text-purple-800',
    Medicine: 'bg-red-100 text-red-800',
  };

  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export default function DecksPage() {
  const router = useRouter();

  const handleDeleteDeck = (deckId: string | number) => {
    console.log('Deck deleted:', deckId);
  };

  const handleEditDeck = (deckId: string | number) => {
    router.push(`/decks/edit/${deckId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Decks</h1>
              <p className="text-gray-500 mt-1">
                Manage your flashcard collections
              </p>
            </div>

            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm"
              onClick={() => router.push('/decks/add')}
            >
              + New Deck
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {decks.length}
            </div>
            <div className="text-sm text-gray-500">Total Decks</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {decks.reduce((sum, deck) => sum + deck.cards, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Cards</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-500">
              {decks.reduce((sum, deck) => sum + deck.due, 0)}
            </div>
            <div className="text-sm text-gray-500">Cards Due</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                decks.reduce((sum, deck) => sum + deck.progress, 0) /
                  decks.length
              )}
              %
            </div>
            <div className="text-sm text-gray-500">Avg Progress</div>
          </div>
        </div>

        {/* Decks Grid */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="p-6 flex flex-col h-full">
                {/* Card Header */}
                <CardHeader className="p-0 pb-5">
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      className={`${getCategoryColor(
                        deck.category
                      )} text-xs px-3 py-1 rounded-full font-medium`}
                    >
                      {deck.category}
                    </Badge>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs font-medium text-red-600">
                          {deck.due} due
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100"
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
                              cardCount={deck.cards}
                              onDelete={handleDeleteDeck}
                              trigger={
                                <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer rounded-sm">
                                  <Trash2 className="w-4 h-4" />
                                  Delete Deck
                                </div>
                              }
                            />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold text-gray-900 mb-3 leading-tight">
                    {deck.title}
                  </CardTitle>

                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                    {deck.description}
                  </p>
                </CardHeader>

                <CardContent className="p-0 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xs">📚</span>
                        </div>
                        <span className="font-medium">{deck.cards} cards</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {deck.progress}%
                      </div>
                      <div className="text-xs text-gray-500">complete</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Progress
                      value={deck.progress}
                      className="h-2.5 bg-gray-100"
                    />
                  </div>
                  <div className="mb-5">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                      Last studied: {deck.lastStudied}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-medium shadow-sm"
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
      </div>
    </div>
  );
}
