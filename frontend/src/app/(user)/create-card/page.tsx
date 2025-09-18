'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, X } from 'lucide-react';
import { getDecks } from '@/lib/deck-service';
import { createCard } from '@/lib/card-service';

interface DeckData {
  id: number;
  title: string;
}

interface CardData {
  id: number;
  frontContent: string;
  backContent: string;
  difficulty: string;
  deckId: number;
  tags?: string;
  userId: number;
}

const MAX_QUESTION_LENGTH = 150;
const MAX_ANSWER_LENGTH = 300;

export default function CreateNewCard() {
  const [creationMethod, setCreationMethod] = useState('Manual Form');
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckData[]>([]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await getDecks();
      setDecks(response.data.data || []);
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

  const isValidInput = (input: string) => {
    return input.trim().length > 0;
  };

  const handleManualSave = async () => {
    if (
      !isValidInput(question) ||
      !isValidInput(answer) ||
      selectedDeckId === null
    ) {
      alert('Please fill out all required fields.');
      return;
    }

    const newCardPayload = {
      frontContent: question,
      backContent: answer,
      deckId: selectedDeckId,
    };

    try {
      const response = await createCard(newCardPayload);
      setQuestion('');
      setAnswer('');
      setError(null);
      alert('Card created successfully!');
    } catch (err) {
      setError('Failed to save card. Please try again.');
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleBulkUpload = async () => {
    if (!file || selectedDeckId === null) {
      alert('Please select a file and a deck.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const newCards = [];
      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        const [frontContent, backContent] = line
          .split('|')
          .map((item) => item.trim());
        if (isValidInput(frontContent) && isValidInput(backContent)) {
          const newCardPayload = {
            frontContent,
            backContent,
            deckId: selectedDeckId,
          };
          try {
            await createCard(newCardPayload);
            successCount++;
          } catch (err) {
            console.error('Failed to upload a card:', err);
            errorCount++;
          }
        }
      }
      setFile(null);
      setError(null);
      alert(
        `Successfully created ${successCount} cards. ${errorCount} cards failed.`
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Create New Card
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add flashcards to your collection
        </p>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Choose Creation Method
          </h2>
          <div className="flex gap-4">
            <Button
              variant={creationMethod === 'Manual Form' ? 'default' : 'outline'}
              onClick={() => {
                setCreationMethod('Manual Form');
              }}
              className="flex-1 py-4 px-4"
            >
              Manual Form
            </Button>
            <Button
              variant={creationMethod === 'File Upload' ? 'default' : 'outline'}
              onClick={() => {
                setCreationMethod('File Upload');
              }}
              className="flex-1 py-4 px-4"
            >
              File Upload
            </Button>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Select Deck
          </h2>
          <div className="space-y-2">
            <Label
              htmlFor="select-deck"
              className="text-gray-700 dark:text-gray-300"
            >
              Choose an existing deck
            </Label>
            <select
              id="select-deck"
              value={selectedDeckId || ''}
              onChange={(e) => setSelectedDeckId(Number(e.target.value))}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
            >
              <option value="">Choose a deck...</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {creationMethod === 'Manual Form' && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Manual Card Creation
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="question"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Question
                </Label>
                <Input
                  id="question"
                  placeholder="Enter your question..."
                  value={question}
                  onChange={(e) =>
                    setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))
                  }
                />
                <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
                  {question.length}/{MAX_QUESTION_LENGTH}
                </span>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="answer"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Answer
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Enter the answer..."
                  value={answer}
                  onChange={(e) =>
                    setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))
                  }
                  className="resize-none"
                />
                <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
                  {answer.length}/{MAX_ANSWER_LENGTH}
                </span>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleManualSave}
                  disabled={selectedDeckId === null}
                >
                  Save Card
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* File Upload Section */}
        {creationMethod === 'File Upload' && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Bulk Upload from File
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="file-upload"
                  className="text-gray-700 dark:text-gray-300"
                >
                  Upload File (.txt)
                </Label>
                <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
                  {!file ? (
                    <>
                      <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Select a .txt file with your cards
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Format: Question|Answer (one card per line)
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Example: What is 2+2?|4
                      </p>
                      <label
                        htmlFor="file-upload-input"
                        className="mt-4 inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Choose file
                      </label>
                      <input
                        id="file-upload-input"
                        type="file"
                        accept=".txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleBulkUpload}
                  disabled={!file || !selectedDeckId}
                >
                  Create Cards
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Section */}
        <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
            <span className="text-yellow-500 mr-2">💡</span>Instructions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong className="text-gray-800 dark:text-gray-200">
              Manual Form:
            </strong>{' '}
            Create cards one by one using the form above.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong className="text-gray-800 dark:text-gray-200">
              File Upload:
            </strong>{' '}
            Upload a .txt file with multiple cards at once.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong className="text-gray-800 dark:text-gray-200">
              File Format:
            </strong>{' '}
            Each line should contain: Question|Answer
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            <strong className="text-gray-800 dark:text-gray-200">
              Example file contents:
            </strong>
          </p>
          <pre className="mt-2 text-xs border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            What is the capital of France?|Paris How do you say hello in
            Spanish?|Hola What is 15 x 12?|180
          </pre>
        </div>
      </div>
    </div>
  );
}
