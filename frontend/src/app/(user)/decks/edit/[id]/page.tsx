'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';

const categories = [
  { value: 'Language', label: 'Language', color: 'bg-blue-100 text-blue-800' },
  {
    value: 'Technology',
    label: 'Technology',
    color: 'bg-green-100 text-green-800',
  },
  {
    value: 'Education',
    label: 'Education',
    color: 'bg-purple-100 text-purple-800',
  },
  { value: 'Medicine', label: 'Medicine', color: 'bg-red-100 text-red-800' },
  {
    value: 'Science',
    label: 'Science',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    value: 'History',
    label: 'History',
    color: 'bg-orange-100 text-orange-800',
  },
];

// Mock data - replace with actual API call when backend is ready
const mockDecks = [
  {
    id: '1',
    title: 'Spanish Vocabulary',
    description: 'Common Spanish words and phrases',
    category: 'Language',
    isPublic: false,
    cards: 45,
    progress: 78,
  },
  {
    id: '2',
    title: 'Programming Concepts',
    description: 'Data structures, algorithms, and programming principles',
    category: 'Technology',
    isPublic: true,
    cards: 67,
    progress: 92,
  },
];

export default function EditDeckPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDeck, setIsLoadingDeck] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: false,
  });

  // Load deck data
  useEffect(() => {
    const loadDeck = async () => {
      try {
        // TODO: Replace with actual API call when backend is ready
        const deck = mockDecks.find((d) => d.id === deckId);

        if (deck) {
          setFormData({
            title: deck.title,
            description: deck.description || '',
            category: deck.category,
            isPublic: deck.isPublic,
          });
        } else {
          // Deck not found, redirect to decks page
          router.push('/decks');
        }
      } catch (error) {
        console.error('Error loading deck:', error);
        router.push('/decks');
      } finally {
        setIsLoadingDeck(false);
      }
    };

    if (deckId) {
      loadDeck();
    }
  }, [deckId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call when backend is ready
      console.log('Updating deck:', { id: deckId, ...formData });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect back to decks page
      router.push('/decks');
    } catch (error) {
      console.error('Error updating deck:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoadingDeck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deck...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Edit Deck</h1>
              <p className="text-gray-500 mt-1">
                Update your flashcard deck information
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                // TODO: Implement delete functionality
                console.log('Delete deck:', deckId);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Deck Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Deck Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Spanish Vocabulary, React Concepts"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange('title', e.target.value)
                      }
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of what this deck covers..."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      rows={4}
                      className="w-full resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange('category', value)
                      }
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${category.color.split(' ')[0]}`}
                              ></div>
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Privacy Settings */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Privacy Settings
                    </Label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={formData.isPublic}
                        onChange={(e) =>
                          handleInputChange('isPublic', e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Label
                        htmlFor="isPublic"
                        className="text-sm text-gray-700"
                      >
                        Make this deck public (others can view and study)
                      </Label>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isLoading || !formData.title || !formData.category
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Preview Card */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      {formData.category && (
                        <div
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            categories.find(
                              (c) => c.value === formData.category
                            )?.color || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {formData.category}
                        </div>
                      )}
                      <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">3 due</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2">
                      {formData.title || 'Deck Title'}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4">
                      {formData.description ||
                        'Deck description will appear here...'}
                    </p>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        📚 45 cards
                      </span>
                      <span className="text-gray-600">78% complete</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: '78%' }}
                      ></div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        Study Now
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-900 mb-2">ℹ️ Note</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Changes will be saved immediately</li>
                      <li>• Cards and progress remain unchanged</li>
                      <li>• Public decks can be discovered by others</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
