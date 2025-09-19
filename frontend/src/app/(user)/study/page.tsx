'use client';

import React, { useState, useEffect } from 'react';
import { IoBulbOutline } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ConfettiPiece {
  id: number;
  color: string;
  left: number;
  duration: number;
  delay: number;
}

export default function StudyPage() {
  const flashcards = [
    { id: 1, question: 'What is the capital of France?', answer: 'Paris' },
    {
      id: 2,
      question: 'Who painted the Mona Lisa?',
      answer: 'Leonardo da Vinci',
    },
    { id: 3, question: 'What is the chemical symbol for gold?', answer: 'Au' },
    {
      id: 4,
      question: 'How many planets are in our solar system?',
      answer: 'Eight',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(
    null
  );
  const [isComplete, setIsComplete] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isComplete) {
      const newConfetti: ConfettiPiece[] = [];
      for (let i = 0; i < 150; i++) {
        newConfetti.push({
          id: i,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`,
          left: Math.random() * 100,
          duration: 2 + Math.random() * 3,
          delay: Math.random() * 2,
        });
      }
      setConfetti(newConfetti);
    } else setConfetti([]);
  }, [isComplete]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setErrorMessage(null);
  };

  const handleDifficultySelect = (level: number) =>
    setSelectedDifficulty(level);

  const handleNextCard = () => {
    if (!selectedDifficulty)
      return setErrorMessage(
        'Please select a difficulty level before proceeding.'
      );

    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
      setSelectedDifficulty(null);
      setErrorMessage(null);
    } else setIsComplete(true);
  };

  const handleSkipCard = () => {
    if (currentIndex + 1 < flashcards.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
      setSelectedDifficulty(null);
    } else setIsComplete(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSelectedDifficulty(null);
    setIsComplete(false);
  };

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 relative overflow-hidden font-sans">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: c.color,
              left: `${c.left}vw`,
              animation: `confetti-fall ${c.duration}s linear infinite`,
              animationDelay: `${c.delay}s`,
              top: '-10px',
            }}
          />
        ))}
        <style jsx>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>

        <Card className="w-full max-w-md text-center z-10">
          <CardHeader>
            <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full mx-auto mb-4 w-fit">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-300"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">
              Study Session Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You have completed {flashcards.length} cards. Great job!
            </p>
            <div className="flex flex-row justify-center gap-4">
              <Button onClick={handleRestart}>Study Again</Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen pt-[5rem] bg-background text-foreground p-4 font-sans relative">
      {/* Progress */}
      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-2xl font-semibold">
          Card {currentIndex + 1} of {flashcards.length}
        </h2>
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="'text-lg font-semibold'">
            {flashcards.length - (currentIndex + 1)} remaining
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {/* Stacked background cards */}
      <div className="relative w-full max-w-2xl h-[550px]">
        {Array.from({ length: 7 }).map((_, i: number) => (
          <div
            key={i}
            className={`absolute w-full h-full rounded-xl border ${
              i % 2 === 0
                ? 'bg-gray-200 dark:bg-gray-800'
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
            style={{
              top: `${i * 6}px`,
              left: `${i * 9}px`,
              zIndex: 0,
              opacity: 0.5 - i * 0.06,
            }}
          />
        ))}

        {/* Main Card */}
        <Card className="absolute inset-0 flex flex-col items-center text-center z-10 shadow-xl">
          <div className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-bold">
            #{currentCard.id}
          </div>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-blue-500 mt-4">
              ?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center flex-grow w-full">
            <p className="mt-4 text-2xl font-semibold">
              {currentCard.question}
            </p>

            {showAnswer && (
              <div className="mt-8 pt-4 border-t border-border w-full">
                <div className="flex items-center justify-center text-blue-500 font-semibold mb-2">
                  <IoBulbOutline className="w-5 h-5 mr-2" />
                  <span className="text-2xl font-semibold">Answer</span>
                </div>
                <p className="text-2xl font-bold">{currentCard.answer}</p>
              </div>
            )}

            <div className="flex-grow flex items-end w-full">
              {showAnswer ? (
                <div className="w-full">
                  <p className="text-base text-gray-600 dark:text-gray-400 mb-8">
                    How well did you know this? please select then go next
                  </p>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleDifficultySelect(level)}
                        className={`flex-1 py-3 rounded-lg font-semibold transition
                          ${selectedDifficulty === level ? 'ring-4 ring-blue-500 scale-105' : ''}
                          ${
                            level === 1
                              ? 'bg-red-500 text-white'
                              : level === 2
                                ? 'bg-orange-400 text-white'
                                : level === 3
                                  ? 'bg-yellow-400 text-gray-900'
                                  : level === 4
                                    ? 'bg-green-500 text-white'
                                    : 'bg-blue-500 text-white'
                          }
                        `}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="text-base text-gray-500 dark:text-gray-400 mt-2 text-center">
                    1 = Again • 2 = Hard • 3 = Good • 4 = Easy • 5 = Perfect
                  </div>
                  <div className="flex justify-between gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleSkipCard}
                      className="flex-1 py-4 px-6"
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleNextCard}
                      disabled={!selectedDifficulty}
                      className={`flex-1 py-4 px-6 text-white dark:text-gray-900 
      ${
        !selectedDifficulty
          ? 'bg-gray-700 dark:bg-gray-300 cursor-not-allowed'
          : 'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200'
      }
    `}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleShowAnswer}
                  className="w-full bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                >
                  <IoBulbOutline className="w-5 h-5 mr-2" />
                  Show answer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {errorMessage && (
        <p className="mt-4 text-red-500 font-semibold text-sm">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
