'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, X, Pencil, Trash2, ArrowLeft } from 'lucide-react';

// Define the shape of a flashcard object
interface CardData {
  id: number;
  question: string;
  answer: string;
  difficulty: string;
  deck: string;
  tags?: string;
}

const CARDS_PER_PAGE = 4;
const MAX_QUESTION_LENGTH = 150;
const MAX_ANSWER_LENGTH = 300;

export default function CreateNewCard() {
  const [creationMethod, setCreationMethod] = useState('Manual Form');
  const [cards, setCards] = useState<CardData[]>([]);
  const [deckName, setDeckName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [viewingCards, setViewingCards] = useState(false);
  const [page, setPage] = useState(1);

  // Validation function to check if input is not just whitespace
  const isValidInput = (input: string) => {
    return input.trim().length > 0;
  };

  // Handles saving a manually created card
  const handleManualSave = () => {
    if (
      !isValidInput(question) ||
      !isValidInput(answer) ||
      !isValidInput(deckName)
    ) {
      alert(
        'Please fill out all required fields (Question, Answer, and Deck Name).'
      );
      return;
    }
    const newCard: CardData = {
      id: Date.now(),
      question,
      answer,
      difficulty,
      deck: deckName,
      tags,
    };
    setCards([...cards, newCard]);
    setQuestion('');
    setAnswer('');
    setDifficulty('Medium');
    setTags('');
    setViewingCards(true); // Switch to the card view
    setPage(1); // Reset to the first page
  };

  // Handles editing a card
  const handleEdit = (card: CardData) => {
    setEditingCard(card);
    setQuestion(card.question);
    setAnswer(card.answer);
    setDifficulty(card.difficulty);
    setDeckName(card.deck);
    setTags(card.tags || '');
    setViewingCards(false); // Switch back to the form
  };

  // Handles saving the edited card
  const handleEditSave = () => {
    if (editingCard) {
      if (
        !isValidInput(question) ||
        !isValidInput(answer) ||
        !isValidInput(deckName)
      ) {
        alert(
          'Please fill out all required fields (Question, Answer, and Deck Name) before saving.'
        );
        return;
      }
      const updatedCards = cards.map((card) =>
        card.id === editingCard.id
          ? { ...card, question, answer, difficulty, deck: deckName, tags }
          : card
      );
      setCards(updatedCards);
      setEditingCard(null);
      setQuestion('');
      setAnswer('');
      setDifficulty('Medium');
      setDeckName('');
      setTags('');
      setViewingCards(true); // Return to the card view
    }
  };

  // Handles deleting a card
  const handleDelete = (id: number) => {
    const updatedCards = cards.filter((card) => card.id !== id);
    setCards(updatedCards);
    if (updatedCards.length === 0) {
      setViewingCards(false);
    } else {
      const newTotalPages = Math.ceil(updatedCards.length / CARDS_PER_PAGE);
      if (page > newTotalPages) {
        setPage(newTotalPages);
      }
    }
  };

  // Handles file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleBulkUpload = () => {
    if (!file || !isValidInput(deckName)) {
      alert('Please select a file and provide a deck name.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const newCards: CardData[] = lines
        .map((line) => {
          const [q, a, d] = line.split('|').map((item) => item.trim());
          return {
            id: Date.now() + Math.random(),
            question: q || 'No Question',
            answer: a || 'No Answer',
            difficulty: d || 'Medium',
            deck: deckName,
          };
        })
        .filter(
          (card) => isValidInput(card.question) && isValidInput(card.answer)
        );

      setCards([...cards, ...newCards]);
      setFile(null);
      setDeckName('');
      setViewingCards(true); // Switch to the card view
      setPage(1); // Reset to the first page
    };
    reader.readAsText(file);
  };

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const paginatedCards = cards.slice(
    (page - 1) * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE
  );

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
        <h1
          className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 cursor-pointer"
          onClick={() => setViewingCards(!viewingCards)}
        >
          <span className="text-gray-500 font-bold">
            <ArrowLeft className="inline-block h-6 w-6 mr-2" />
          </span>
          {viewingCards ? 'All Cards' : 'Create New Card'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add flashcards to your collection
        </p>

        {/* Creation Method Selection */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Choose Creation Method
          </h2>
          <div className="flex gap-4">
            <Button
              variant={creationMethod === 'Manual Form' ? 'default' : 'outline'}
              onClick={() => {
                setCreationMethod('Manual Form');
                setViewingCards(false);
              }}
              className="flex-1 py-4 px-4"
            >
              Manual Form
            </Button>
            <Button
              variant={creationMethod === 'File Upload' ? 'default' : 'outline'}
              onClick={() => {
                setCreationMethod('File Upload');
                setViewingCards(false);
              }}
              className="flex-1 py-4 px-4"
            >
              File Upload
            </Button>
          </div>
        </div>

        {viewingCards ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Your Flashcards
            </h2>

            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500 dark:text-gray-400">
                <FileText className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">
                  No flashcards created yet.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedCards.map((card) => (
                    <Card key={card.id} className="rounded-lg shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 break-words">
                          {card.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-2 break-words">
                          {card.answer}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Deck: {card.deck}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Difficulty: {card.difficulty}
                        </p>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(card)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(card.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center mt-6 space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((page) => page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((page) => page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            <div className="flex justify-end mt-6">
              <Button
                onClick={() => {
                  setViewingCards(false);
                  setEditingCard(null);
                  setQuestion('');
                  setAnswer('');
                  setDeckName('');
                  setDifficulty('Medium');
                  setTags('');
                }}
              >
                Add New Card
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Manual Form Section */}
            {creationMethod === 'Manual Form' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {editingCard ? 'Edit Card' : 'Manual Card Creation'}
                </h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="select-deck"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Select Deck
                    </Label>
                    <select
                      id="select-deck"
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
                    >
                      <option value="">Choose a deck...</option>
                      <option value="Math">Math</option>
                      <option value="History">History</option>
                    </select>
                  </div>
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
                        setQuestion(
                          e.target.value.slice(0, MAX_QUESTION_LENGTH)
                        )
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="difficulty"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Difficulty
                      </Label>
                      <select
                        id="difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="tags"
                        className="text-gray-700 dark:text-gray-300"
                      >
                        Tags (optional)
                      </Label>
                      <Input
                        id="tags"
                        placeholder="e.g., vocabulary, grammar"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      variant="outline"
                      className="mr-2"
                      onClick={() => {
                        setViewingCards(true);
                        setEditingCard(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingCard ? handleEditSave : handleManualSave}
                    >
                      {editingCard ? 'Save Changes' : 'Save Card'}
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
                      htmlFor="deck-name"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Deck Name
                    </Label>
                    <Input
                      id="deck-name"
                      placeholder="Enter name for the new deck..."
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                    />
                  </div>
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
                            Format: Question|Answer|Difficulty (one card per
                            line)
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Example: What is 2+2?|4|Easy
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
                    <Button variant="outline" className="mr-2">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkUpload}
                      disabled={!file || !deckName}
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
                Each line should contain: Question|Answer|Difficulty
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <strong className="text-gray-800 dark:text-gray-200">
                  Example file contents:
                </strong>
              </p>
              <pre className="mt-2 text-xs border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                What is the capital of France?|Paris|Easy How do you say hello
                in Spanish?|Hola|Easy What is 15 x 12?|180|Medium
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
