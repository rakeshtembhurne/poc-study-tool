'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus } from 'lucide-react';

const categories = [
  {
    value: 'Language',
    label: 'Language',
    color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  },
  {
    value: 'Technology',
    label: 'Technology',
    color:
      'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
  },
  {
    value: 'Education',
    label: 'Education',
    color:
      'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
  },
  {
    value: 'Medicine',
    label: 'Medicine',
    color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  },
  {
    value: 'Science',
    label: 'Science',
    color:
      'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
  },
  {
    value: 'History',
    label: 'History',
    color:
      'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
  },
];

export default function AddDeckPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: false,
  });

  const [errors, setErrors] = useState({
    title: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Creating deck:', formData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push('/decks');
    } catch (error) {
      console.error('Error creating deck:', error);
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create New Deck
              </h1>
              <p className="text-muted-foreground mt-1">
                Add a new flashcard deck to your collection
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Plus className="w-5 h-5" />
                  Deck Information
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
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
                            ? 'text-red-500'
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
                          ? 'border-red-500 focus:border-red-500'
                          : ''
                      }`}
                    />
                    {errors.title && (
                      <p className="text-xs text-red-500">{errors.title}</p>
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
                            ? 'text-red-500'
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
                          ? 'border-red-500 focus:border-red-500'
                          : ''
                      }`}
                    />
                    {errors.description && (
                      <p className="text-xs text-red-500">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="category"
                      className="text-sm font-medium text-foreground"
                    >
                      Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange('category', value)
                      }
                      required
                    >
                      <SelectTrigger className="w-full bg-background">
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
                              <span className="text-foreground">
                                {category.label}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      disabled={
                        isLoading || !formData.title || !formData.category
                      }
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {isLoading ? 'Creating...' : 'Create Deck'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
                <div className="space-y-4">
                  <div className="border border-border rounded-lg p-4 bg-card h-[280px] flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      {formData.category && (
                        <div
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            categories.find(
                              (c) => c.value === formData.category
                            )?.color || 'bg-muted text-foreground'
                          }`}
                        >
                          {formData.category}
                        </div>
                      )}
                      <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">
                          0 due
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-foreground mb-2 line-clamp-2">
                      {truncateText(formData.title || 'Deck Title', 50)}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-3">
                      {truncateText(
                        formData.description ||
                          'Deck description will appear here...',
                        80
                      )}
                    </p>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        📚 0 cards
                      </span>
                      <span className="text-muted-foreground">0% complete</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: '0%' }}
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
                        className="flex-1 bg-primary hover:bg-primary/90 text-xs"
                      >
                        Study Now
                      </Button>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 h-[200px] overflow-y-auto">
                    <h4 className="font-medium text-primary mb-2">💡 Tips</h4>
                    <ul className="text-sm text-primary/90 space-y-1">
                      <li>• Title: Max 100 characters</li>
                      <li>• Description: Max 200 characters</li>
                      <li>• Choose a clear, descriptive title</li>
                      <li>• Select the most relevant category</li>
                      <li>• You can add cards after creating the deck</li>
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
