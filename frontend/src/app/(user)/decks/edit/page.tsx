'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { getDeckById, updateDeck } from '@/lib/deck-service';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function EditDeckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('id');
  console.log('deckId from searchParams:', deckId);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDeck, setIsLoadingDeck] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
  });
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    api: '', // For API errors
  });

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Load deck data
  useEffect(() => {
    const loadDeck = async () => {
      try {
        if (!deckId) {
          router.push('/decks');
          return;
        }
        const response = await getDeckById(deckId);
        const deck = response.data; // The deck data is nested

        if (deck) {
          setFormData({
            title: deck.title || 'axbc',
            description: deck.description || 'abc',
            isPublic: deck.isPublic,
          });
        } else {
          // Deck not found, redirect to decks page
          router.push('/decks');
        }
      } catch (error) {
        console.error('Error loading deck:', error);
        setErrors((prev) => ({ ...prev, api: 'Failed to load deck data.' }));
        // Optionally redirect or show a more prominent error message
      } finally {
        setIsLoadingDeck(false);
      }
    };

    loadDeck();
  }, [deckId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ title: '', description: '', api: '' });

    try {
      if (!deckId) {
        return;
      }
      const { title, description, isPublic } = formData;
      await updateDeck(deckId, { title, description, isPublic });

      // Redirect back to decks page
      router.push('/decks');
    } catch (error: any) {
      console.error('Error updating deck:', error);
      setErrors((prev) => ({
        ...prev,
        api: error.response?.data?.message || 'An unexpected error occurred.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'title' || field === 'description') {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    if (field === 'title' && typeof value === 'string') {
      if (value.length > 35) {
        setErrors((prev) => ({
          ...prev,
          title: 'Title must be 35 characters or less',
        }));
        return;
      }
    }

    if (field === 'description' && typeof value === 'string') {
      if (value.length > 40) {
        setErrors((prev) => ({
          ...prev,
          description: 'Description must be 40 characters or less',
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoadingDeck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading deck...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-[80vw] mx-auto space-y-8">
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl font-bold text-foreground">
                  Edit Deck
                </h1>
                <p className="text-muted-foreground mt-1">
                  Update your flashcard deck information
                </p>
              </div>
            </div>
          </div>

          {errors.api && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md">
              {errors.api}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Edit3 className="w-5 h-5" />
                    Deck Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label
                          htmlFor="title"
                          className="text-sm font-medium text-foreground"
                        >
                          Deck Title *
                        </Label>
                        <span
                          className={`text-xs ${
                            formData.title.length > 30
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formData.title.length}/35
                        </span>
                      </div>
                      <Input
                        id="title"
                        placeholder="e.g., Spanish Vocabulary, React Concepts"
                        value={formData.title}
                        onChange={(e) =>
                          handleInputChange('title', e.target.value)
                        }
                        required
                        className={`w-full bg-background ${
                          errors.title
                            ? 'border-destructive focus:border-destructive'
                            : ''
                        }`}
                      />
                      {errors.title && (
                        <p className="text-xs text-destructive">
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label
                          htmlFor="description"
                          className="text-sm font-medium text-foreground"
                        >
                          Description
                        </Label>
                        <span
                          className={`text-xs ${
                            formData.description.length > 35
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {formData.description.length}/40
                        </span>
                      </div>
                      <Textarea
                        id="description"
                        placeholder="Brief description of what this deck covers..."
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange('description', e.target.value)
                        }
                        rows={4}
                        className={`w-full resize-none bg-background ${
                          errors.description
                            ? 'border-destructive focus:border-destructive'
                            : ''
                        }`}
                      />
                      {errors.description && (
                        <p className="text-xs text-destructive">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    {/* Privacy Settings */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-foreground">
                        Privacy Settings
                      </Label>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="isPublic"
                          className="text-sm text-muted-foreground"
                        >
                          Make this deck public (others can view and study)
                        </Label>
                        <Switch
                          id="isPublic"
                          checked={formData.isPublic}
                          onCheckedChange={(checked) =>
                            handleInputChange('isPublic', checked)
                          }
                        />
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
                        disabled={isLoading || !formData.title}
                        className="flex-1"
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
                  <CardTitle className="text-lg text-foreground">
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Card className="bg-card border rounded-xl shadow-sm flex flex-col h-full">
                    <div className="p-6 flex flex-col h-full">
                      {/* Card Header */}
                      <CardHeader className="p-0 pb-5">
                        <div className="flex justify-between items-start mb-3">
                          <Badge
                            className={
                              formData.isPublic
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900'
                                : 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900'
                            }
                          >
                            {formData.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CardTitle className="text-xl font-bold text-foreground mb-3 leading-tight line-clamp-2">
                              {truncateText(formData.title || 'Deck Title', 50)}
                            </CardTitle>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{formData.title || 'Deck Title'}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {truncateText(
                                formData.description ||
                                  'Deck description will appear here...',
                                80
                              )}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {formData.description ||
                                'Deck description will appear here...'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </CardHeader>

                      <CardContent className="p-0 flex-1 flex flex-col">
                        <div className="mt-auto">
                          <Button
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 text-sm font-medium shadow-sm"
                          >
                            Study Now
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
