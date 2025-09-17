// // 'use client';

// // import { useState, useEffect } from 'react';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { Textarea } from '@/components/ui/textarea';
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import { FileText, X, Pencil, Trash2, ArrowLeft } from 'lucide-react';
// // import { getDecks } from '@/lib/deck-service';
// // import { createCard, updateCard, deleteCard, getCardsByUserId } from '@/lib/card-service';

// // // Define the shape of a deck and a flashcard object
// // interface DeckData {
// //   id: number;
// //   title: string;
// // }

// // interface CardData {
// //   id: number;
// //   frontContent: string;
// //   backContent: string;
// //   difficulty: string;
// //   deckId: number;
// //   tags?: string;
// //   userId: number;
// // }

// // const CARDS_PER_PAGE = 4;
// // const MAX_QUESTION_LENGTH = 150;
// // const MAX_ANSWER_LENGTH = 300;

// // export default function CreateNewCard() {
// //   const [creationMethod, setCreationMethod] = useState('Manual Form');
// //   const [cards, setCards] = useState<CardData[]>([]);
// //   const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
// //   const [question, setQuestion] = useState('');
// //   const [answer, setAnswer] = useState('');
// //   const [difficulty, setDifficulty] = useState('Medium');
// //   const [tags, setTags] = useState('');
// //   const [file, setFile] = useState<File | null>(null);
// //   const [editingCard, setEditingCard] = useState<CardData | null>(null);
// //   const [viewingCards, setViewingCards] = useState(false);
// //   const [page, setPage] = useState(1);
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [decks, setDecks] = useState<DeckData[]>([]);
// //   const [userId, setUserId] = useState<number | null>(null);
// //   const [deckName, setDeckName] = useState("");

// //   // Placeholder function to get the current user ID
// //   const getCurrentUserId = (): number => {
// //     return 1; // Example user ID
// //   };

// //   const fetchDecks = async () => {
// //     try {
// //       setLoading(true);
// //       const response = await getDecks();
// //       setDecks(response.data.data || []);
// //       setError(null);
// //     } catch (err) {
// //       setError('Failed to fetch decks. Please try again later.');
// //       console.error(err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const fetchCards = async (deckId: number) => {
// //     try {
// //       setLoading(true);
// //       const response = await getCardsByUserId(deckId);
// //       setCards(response.data.data || []);
// //       setError(null);
// //     } catch (err) {
// //       setError('Failed to fetch cards. Please try again later.');
// //       console.error(err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchDecks();
// //     setUserId(getCurrentUserId());
// //   }, []);

// //   useEffect(() => {
// //     if (selectedDeckId) {
// //       fetchCards(selectedDeckId);
// //     } else {
// //       setCards([]);
// //     }
// //   }, [selectedDeckId]);

// //   const isValidInput = (input: string) => {
// //     return input.trim().length > 0;
// //   };

// //   const handleManualSave = async () => {
// //     if (!isValidInput(question) || !isValidInput(answer) || selectedDeckId === null || userId === null) {
// //       alert('Please fill out all required fields.');
// //       return;
// //     }

// //     // REMOVED 'difficulty' and 'tags' from the payload to match the backend DTO
// //     const newCardPayload = {
// //       frontContent: question,
// //       backContent: answer,
// //       deckId: selectedDeckId,
// //       userId,
// //     };

// //     try {
// //       const response = await createCard(newCardPayload);
// //       setCards([...cards, response.newCard]);
// //       setQuestion('');
// //       setAnswer('');
// //       setViewingCards(true);
// //       setPage(1);
// //       setError(null);
// //     } catch (err) {
// //       setError('Failed to save card. Please try again.');
// //       console.error(err);
// //     }
// //   };

// //   const handleEdit = (card: CardData) => {
// //     setEditingCard(card);
// //     setQuestion(card.frontContent);
// //     setAnswer(card.backContent);
// //     setSelectedDeckId(card.deckId);
// //     setViewingCards(false);
// //   };

// //   const handleEditSave = async () => {
// //     if (editingCard) {
// //       if (!isValidInput(question) || !isValidInput(answer) || selectedDeckId === null) {
// //         alert('Please fill out all required fields before saving.');
// //         return;
// //       }
// //       // REMOVED 'difficulty' and 'tags' from the payload to match the backend DTO
// //       const updatedCardPayload = {
// //         frontContent: question,
// //         backContent: answer,
// //       };

// //       try {
// //         const response = await updateCard(editingCard.id, updatedCardPayload);
// //         const updatedCards = cards.map((card) =>
// //           card.id === editingCard.id ? response.updatedCard : card
// //         );
// //         setCards(updatedCards);
// //         setEditingCard(null);
// //         setQuestion('');
// //         setAnswer('');
// //         setSelectedDeckId(null);
// //         setViewingCards(true);
// //         setError(null);
// //       } catch (err) {
// //         setError('Failed to update card. Please try again.');
// //         console.error(err);
// //       }
// //     }
// //   };

// //   const handleDelete = async (id: number) => {
// //     try {
// //       await deleteCard(id);
// //       const updatedCards = cards.filter((card) => card.id !== id);
// //       setCards(updatedCards);
// //       if (updatedCards.length === 0) {
// //         setViewingCards(false);
// //       } else {
// //         const newTotalPages = Math.ceil(updatedCards.length / CARDS_PER_PAGE);
// //         if (page > newTotalPages) {
// //           setPage(newTotalPages);
// //         }
// //       }
// //       setError(null);
// //     } catch (err) {
// //       setError('Failed to delete card. Please try again.');
// //       console.error(err);
// //     }
// //   };

// //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const selectedFile = e.target.files?.[0];
// //     if (selectedFile) {
// //       setFile(selectedFile);
// //     }
// //   };

// //   const handleRemoveFile = () => {
// //     setFile(null);
// //   };

// //   const handleBulkUpload = async () => {
// //     if (!file || selectedDeckId === null || userId === null) {
// //       alert('Please select a file and a deck.');
// //       return;
// //     }

// //     const reader = new FileReader();
// //     reader.onload = async (e) => {
// //       const content = e.target?.result as string;
// //       const lines = content.split('\n');
// //       const newCards = [];

// //       for (const line of lines) {
// //         const [frontContent, backContent] = line.split('|').map((item) => item.trim());
// //         if (isValidInput(frontContent) && isValidInput(backContent)) {
// //           // REMOVED 'difficulty' and 'tags' from the payload
// //           const newCardPayload = {
// //             frontContent,
// //             backContent,
// //             deckId: selectedDeckId,
// //             userId,
// //           };
// //           try {
// //             const response = await createCard(newCardPayload);
// //             newCards.push(response.newCard);
// //           } catch (err) {
// //             console.error('Failed to upload a card:', err);
// //           }
// //         }
// //       }
// //       setCards((prevCards) => [...prevCards, ...newCards]);
// //       setFile(null);
// //       setViewingCards(true);
// //       setPage(1);
// //     };
// //     reader.readAsText(file);
// //   };

// //   const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
// //   const paginatedCards = cards.slice(
// //     (page - 1) * CARDS_PER_PAGE,
// //     page * CARDS_PER_PAGE
// //   );

// //   return (
// //     <div className="min-h-screen py-8">
// //       <div className="max-w-3xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
// //         <h1
// //           className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 cursor-pointer"
// //           onClick={() => {
// //             setViewingCards(!viewingCards);
// //             if (!viewingCards && selectedDeckId) {
// //               fetchCards(selectedDeckId);
// //             }
// //           }}
// //         >
// //           <span className="text-gray-500 font-bold">
// //             <ArrowLeft className="inline-block h-6 w-6 mr-2" />
// //           </span>
// //           {viewingCards ? 'All Cards' : 'Create New Card'}
// //         </h1>
// //         <p className="text-gray-600 dark:text-gray-400 mb-6">
// //           Add flashcards to your collection
// //         </p>

// //         <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
// //           <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
// //             Choose Creation Method
// //           </h2>
// //           <div className="flex gap-4">
// //             <Button
// //               variant={creationMethod === 'Manual Form' ? 'default' : 'outline'}
// //               onClick={() => {
// //                 setCreationMethod('Manual Form');
// //                 setViewingCards(false);
// //               }}
// //               className="flex-1 py-4 px-4"
// //             >
// //               Manual Form
// //             </Button>
// //             <Button
// //               variant={creationMethod === 'File Upload' ? 'default' : 'outline'}
// //               onClick={() => {
// //                 setCreationMethod('File Upload');
// //                 setViewingCards(false);
// //               }}
// //               className="flex-1 py-4 px-4"
// //             >
// //               File Upload
// //             </Button>
// //           </div>
// //         </div>

// //         <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
// //           <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
// //             Select Deck
// //           </h2>
// //           <div className="space-y-2">
// //             <Label htmlFor="select-deck" className="text-gray-700 dark:text-gray-300">
// //               Choose an existing deck
// //             </Label>
// //             <select
// //               id="select-deck"
// //               value={selectedDeckId || ''}
// //               onChange={(e) => setSelectedDeckId(Number(e.target.value))}
// //               className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
// //             >
// //               <option value="">Choose a deck...</option>
// //               {decks.map((deck) => (
// //                 <option key={deck.id} value={deck.id}>
// //                   {deck.title}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>
// //         </div>

// //         {viewingCards ? (
// //           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
// //             <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
// //               Your Flashcards
// //             </h2>
// //             {selectedDeckId === null ? (
// //               <p className="text-center text-gray-500">Please select a deck to view its cards.</p>
// //             ) : (
// //               <>
// //                 {cards.length === 0 ? (
// //                   <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500 dark:text-gray-400">
// //                     <FileText className="h-16 w-16 mb-4" />
// //                     <p className="text-lg font-medium">
// //                       No flashcards created yet for this deck.
// //                     </p>
// //                   </div>
// //                 ) : (
// //                   <>
// //                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                       {paginatedCards.map((card) => (
// //                         <Card key={card.id} className="rounded-lg shadow-md">
// //                           <CardHeader>
// //                             <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 break-words">
// //                               {card.frontContent}
// //                             </CardTitle>
// //                           </CardHeader>
// //                           <CardContent>
// //                             <p className="text-gray-600 dark:text-gray-400 mb-2 break-words">
// //                               {card.backContent}
// //                             </p>
// //                             <div className="flex justify-end mt-4 space-x-2">
// //                               <Button
// //                                 variant="outline"
// //                                 size="icon"
// //                                 onClick={() => handleEdit(card)}
// //                               >
// //                                 <Pencil className="h-4 w-4" />
// //                               </Button>
// //                               <Button
// //                                 variant="destructive"
// //                                 size="icon"
// //                                 onClick={() => handleDelete(card.id)}
// //                               >
// //                                 <Trash2 className="h-4 w-4" />
// //                               </Button>
// //                             </div>
// //                           </CardContent>
// //                         </Card>
// //                       ))}
// //                     </div>

// //                     <div className="flex justify-center mt-6 space-x-4">
// //                       <Button
// //                         variant="outline"
// //                         onClick={() => setPage((page) => page - 1)}
// //                         disabled={page === 1}
// //                       >
// //                         Previous
// //                       </Button>
// //                       <span className="text-gray-600 dark:text-gray-400">
// //                         Page {page} of {totalPages}
// //                       </span>
// //                       <Button
// //                         variant="outline"
// //                         onClick={() => setPage((page) => page + 1)}
// //                         disabled={page >= totalPages}
// //                       >
// //                         Next
// //                       </Button>
// //                     </div>
// //                   </>
// //                 )}
// //                 <div className="flex justify-end mt-6">
// //                   <Button onClick={() => setViewingCards(false)}>Add New Card</Button>
// //                 </div>
// //               </>
// //             )}
// //           </div>
// //         ) : (
// //           <>
// //             {creationMethod === 'Manual Form' && (
// //               <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
// //                 <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
// //                   {editingCard ? 'Edit Card' : 'Manual Card Creation'}
// //                 </h2>
// //                 <div className="space-y-6">
// //                   <div className="space-y-2">
// //                     <Label htmlFor="question" className="text-gray-700 dark:text-gray-300">
// //                       Question
// //                     </Label>
// //                     <Input
// //                       id="question"
// //                       placeholder="Enter your question..."
// //                       value={question}
// //                       onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
// //                     />
// //                     <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
// //                       {question.length}/{MAX_QUESTION_LENGTH}
// //                     </span>
// //                   </div>
// //                   <div className="space-y-2">
// //                     <Label htmlFor="answer" className="text-gray-700 dark:text-gray-300">
// //                       Answer
// //                     </Label>
// //                     <Textarea
// //                       id="answer"
// //                       placeholder="Enter the answer..."
// //                       value={answer}
// //                       onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
// //                       className="resize-none"
// //                     />
// //                     <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
// //                       {answer.length}/{MAX_ANSWER_LENGTH}
// //                     </span>
// //                   </div>
// //                   <div className="flex justify-end pt-4">
// //                     <Button
// //                       variant="outline"
// //                       className="mr-2"
// //                       onClick={() => {
// //                         setViewingCards(true);
// //                         setEditingCard(null);
// //                       }}
// //                     >
// //                       Cancel
// //                     </Button>
// //                     <Button onClick={editingCard ? handleEditSave : handleManualSave} disabled={selectedDeckId === null || userId === null}>
// //                       {editingCard ? 'Save Changes' : 'Save Card'}
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </div>
// //             )}
// //             {/* File Upload Section */}
// //             {creationMethod === 'File Upload' && (
// //               <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
// //                 <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
// //                   Bulk Upload from File
// //                 </h2>
// //                 <div className="space-y-6">

// //                   <div className="space-y-2">
// //                     <Label
// //                       htmlFor="file-upload"
// //                       className="text-gray-700 dark:text-gray-300"
// //                     >
// //                       Upload File (.txt)
// //                     </Label>
// //                     <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
// //                       {!file ? (
// //                         <>
// //                           <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto" />
// //                           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
// //                             Select a .txt file with your cards
// //                           </p>
// //                           <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
// //                             Format: Question|Answer|Difficulty (one card per
// //                             line)
// //                           </p>
// //                           <p className="text-xs text-gray-400 dark:text-gray-500">
// //                             Example: What is 2+2?|4|Easy
// //                           </p>
// //                           <label
// //                             htmlFor="file-upload-input"
// //                             className="mt-4 inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
// //                           >
// //                             Choose file
// //                           </label>
// //                           <input
// //                             id="file-upload-input"
// //                             type="file"
// //                             accept=".txt"
// //                             onChange={handleFileChange}
// //                             className="hidden"
// //                           />
// //                         </>
// //                       ) : (
// //                         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
// //                           <div className="flex items-center">
// //                             <FileText className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
// //                             <span className="text-sm text-gray-700 dark:text-gray-300">
// //                               {file.name}
// //                             </span>
// //                           </div>
// //                           <button
// //                             onClick={handleRemoveFile}
// //                             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
// //                           >
// //                             <X className="h-4 w-4" />
// //                           </button>
// //                         </div>
// //                       )}
// //                     </div>
// //                   </div>
// //                   <div className="flex justify-end pt-4">
// //                     <Button variant="outline" className="mr-2">
// //                       Cancel
// //                     </Button>
// //                     <Button
// //                       onClick={handleBulkUpload}
// //                       disabled={!file || !deckName}
// //                     >
// //                       Create Cards
// //                     </Button>
// //                   </div>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Instructions Section */}
// //             <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
// //               <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
// //                 <span className="text-yellow-500 mr-2">💡</span>Instructions
// //               </h3>
// //               <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
// //                 <strong className="text-gray-800 dark:text-gray-200">
// //                   Manual Form:
// //                 </strong>{' '}
// //                 Create cards one by one using the form above.
// //               </p>
// //               <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
// //                 <strong className="text-gray-800 dark:text-gray-200">
// //                   File Upload:
// //                 </strong>{' '}
// //                 Upload a .txt file with multiple cards at once.
// //               </p>
// //               <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
// //                 <strong className="text-gray-800 dark:text-gray-200">
// //                   File Format:
// //                 </strong>{' '}
// //                 Each line should contain: Question|Answer|Difficulty
// //               </p>
// //               <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
// //                 <strong className="text-gray-800 dark:text-gray-200">
// //                   Example file contents:
// //                 </strong>
// //               </p>
// //               <pre className="mt-2 text-xs border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
// //                 What is the capital of France?|Paris|Easy How do you say hello
// //                 in Spanish?|Hola|Easy What is 15 x 12?|180|Medium
// //               </pre>
// //             </div>
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// 'use client';

// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { FileText, X, Pencil, Trash2, ArrowLeft } from 'lucide-react';
// import { getDecks } from '@/lib/deck-service';
// import { createCard, updateCard, deleteCard, getCardsByUserId } from '@/lib/card-service';

// // Define the shape of a deck and a flashcard object
// interface DeckData {
//   id: number;
//   title: string;
// }

// interface CardData {
//   id: number;
//   frontContent: string;
//   backContent: string;
//   difficulty: string;
//   deckId: number;
//   tags?: string;
//   userId: number;
// }

// const CARDS_PER_PAGE = 4;
// const MAX_QUESTION_LENGTH = 150;
// const MAX_ANSWER_LENGTH = 300;

// export default function CreateNewCard() {
//   const [creationMethod, setCreationMethod] = useState('Manual Form');
//   const [cards, setCards] = useState<CardData[]>([]);
//   const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
//   const [question, setQuestion] = useState('');
//   const [answer, setAnswer] = useState('');
//   const [difficulty, setDifficulty] = useState('Medium');
//   const [tags, setTags] = useState('');
//   const [file, setFile] = useState<File | null>(null);
//   const [editingCard, setEditingCard] = useState<CardData | null>(null);
//   const [viewingCards, setViewingCards] = useState(false);
//   const [viewingAllCards, setViewingAllCards] = useState(false); // New state variable
//   const [page, setPage] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [decks, setDecks] = useState<DeckData[]>([]);
//   const [userId, setUserId] = useState<number | null>(null);
//   const [deckName, setDeckName] = useState("");

//   // Placeholder function to get the current user ID
//   const getCurrentUserId = (): number => {
//     return 1; // Example user ID
//   };

//   const fetchDecks = async () => {
//     try {
//       setLoading(true);
//       const response = await getDecks();
//       setDecks(response.data.data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch decks. Please try again later.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCards = async () => {
//     try {
//       setLoading(true);
//       const response = await getCardsByUserId();
//       setCards(response.data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch cards. Please try again later.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchAllCards = async () => {
//     try {
//       setLoading(true);
//       const response = await getCardsByUserId();
//       setCards(response.data.data || []);
//       setError(null);
//     } catch (err) {
//       setError('Failed to fetch all cards. Please try again later.');
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDecks();
//     setUserId(getCurrentUserId());
//     fetchAllCards(); // Fetch all cards on initial load
//   }, []);

//   useEffect(() => {
//     if (selectedDeckId && !viewingAllCards) {
//       fetchCards(selectedDeckId);
//     } else if (viewingAllCards) {
//       fetchAllCards();
//     } else {
//       setCards([]);
//     }
//   }, [selectedDeckId, viewingAllCards]);

//   const isValidInput = (input: string) => {
//     return input.trim().length > 0;
//   };

//   const handleManualSave = async () => {
//     if (!isValidInput(question) || !isValidInput(answer) || selectedDeckId === null || userId === null) {
//       alert('Please fill out all required fields.');
//       return;
//     }

//     const newCardPayload = {
//       frontContent: question,
//       backContent: answer,
//       deckId: selectedDeckId,
//       userId,
//     };

//     try {
//       const response = await createCard(newCardPayload);
//       setCards([...cards, response.newCard]);
//       setQuestion('');
//       setAnswer('');
//       setViewingAllCards(true); // Switch to viewing all cards
//       setViewingCards(true);
//       setPage(1);
//       setError(null);
//     } catch (err) {
//       setError('Failed to save card. Please try again.');
//       console.error(err);
//     }
//   };

//   const handleEdit = (card: CardData) => {
//     setEditingCard(card);
//     setQuestion(card.frontContent);
//     setAnswer(card.backContent);
//     setSelectedDeckId(card.deckId);
//     setViewingCards(false);
//     setViewingAllCards(false);
//   };

//   const handleEditSave = async () => {
//     if (editingCard) {
//       if (!isValidInput(question) || !isValidInput(answer) || selectedDeckId === null) {
//         alert('Please fill out all required fields before saving.');
//         return;
//       }
//       const updatedCardPayload = {
//         frontContent: question,
//         backContent: answer,
//       };

//       try {
//         const response = await updateCard(editingCard.id, updatedCardPayload);
//         const updatedCards = cards.map((card) =>
//           card.id === editingCard.id ? response.updatedCard : card
//         );
//         setCards(updatedCards);
//         setEditingCard(null);
//         setQuestion('');
//         setAnswer('');
//         setSelectedDeckId(null);
//         setViewingAllCards(true); // Switch to viewing all cards
//         setViewingCards(true);
//         setError(null);
//       } catch (err) {
//         setError('Failed to update card. Please try again.');
//         console.error(err);
//       }
//     }
//   };

//   const handleDelete = async (id: number) => {
//     try {
//       await deleteCard(id);
//       const updatedCards = cards.filter((card) => card.id !== id);
//       setCards(updatedCards);
//       if (updatedCards.length === 0) {
//         setViewingCards(false);
//         setViewingAllCards(false);
//       } else {
//         const newTotalPages = Math.ceil(updatedCards.length / CARDS_PER_PAGE);
//         if (page > newTotalPages) {
//           setPage(newTotalPages);
//         }
//       }
//       setError(null);
//     } catch (err) {
//       setError('Failed to delete card. Please try again.');
//       console.error(err);
//     }
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       setFile(selectedFile);
//     }
//   };

//   const handleRemoveFile = () => {
//     setFile(null);
//   };

//   const handleBulkUpload = async () => {
//     if (!file || selectedDeckId === null || userId === null) {
//       alert('Please select a file and a deck.');
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = async (e) => {
//       const content = e.target?.result as string;
//       const lines = content.split('\n');
//       const newCards = [];

//       for (const line of lines) {
//         const [frontContent, backContent] = line.split('|').map((item) => item.trim());
//         if (isValidInput(frontContent) && isValidInput(backContent)) {
//           const newCardPayload = {
//             frontContent,
//             backContent,
//             deckId: selectedDeckId,
//             userId,
//           };
//           try {
//             const response = await createCard(newCardPayload);
//             newCards.push(response.newCard);
//           } catch (err) {
//             console.error('Failed to upload a card:', err);
//           }
//         }
//       }
//       setCards((prevCards) => [...prevCards, ...newCards]);
//       setFile(null);
//       setViewingAllCards(true); // Switch to viewing all cards
//       setViewingCards(true);
//       setPage(1);
//     };
//     reader.readAsText(file);
//   };

//   const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
//   const paginatedCards = cards.slice(
//     (page - 1) * CARDS_PER_PAGE,
//     page * CARDS_PER_PAGE
//   );

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-3xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
//         <h1
//           className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 cursor-pointer"
//           onClick={() => {
//             setViewingAllCards(!viewingAllCards);
//             setViewingCards(!viewingCards);
//             setPage(1); // Reset page when switching views
//           }}
//         >
//           <span className="text-gray-500 font-bold">
//             <ArrowLeft className="inline-block h-6 w-6 mr-2" />
//           </span>
//           {viewingAllCards ? 'All Cards' : 'Create New Card'}
//         </h1>
//         <p className="text-gray-600 dark:text-gray-400 mb-6">
//           Add flashcards to your collection
//         </p>

//         {viewingAllCards ? (
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
//             <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
//               Your Flashcards
//             </h2>
//             {cards.length === 0 ? (
//               <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500 dark:text-gray-400">
//                 <FileText className="h-16 w-16 mb-4" />
//                 <p className="text-lg font-medium">
//                   No flashcards created yet.
//                 </p>
//               </div>
//             ) : (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {paginatedCards.map((card) => (
//                     <Card key={card.id} className="rounded-lg shadow-md">
//                       <CardHeader>
//                         <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 break-words">
//                           {card.frontContent}
//                         </CardTitle>
//                       </CardHeader>
//                       <CardContent>
//                         <p className="text-gray-600 dark:text-gray-400 mb-2 break-words">
//                           {card.backContent}
//                         </p>
//                         <div className="flex justify-end mt-4 space-x-2">
//                           <Button
//                             variant="outline"
//                             size="icon"
//                             onClick={() => handleEdit(card)}
//                           >
//                             <Pencil className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             variant="destructive"
//                             size="icon"
//                             onClick={() => handleDelete(card.id)}
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>

//                 <div className="flex justify-center mt-6 space-x-4">
//                   <Button
//                     variant="outline"
//                     onClick={() => setPage((page) => page - 1)}
//                     disabled={page === 1}
//                   >
//                     Previous
//                   </Button>
//                   <span className="text-gray-600 dark:text-gray-400">
//                     Page {page} of {totalPages}
//                   </span>
//                   <Button
//                     variant="outline"
//                     onClick={() => setPage((page) => page + 1)}
//                     disabled={page >= totalPages}
//                   >
//                     Next
//                   </Button>
//                 </div>
//               </>
//             )}
//           </div>
//         ) : (
//           <>
//             <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
//               <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
//                 Choose Creation Method
//               </h2>
//               <div className="flex gap-4">
//                 <Button
//                   variant={creationMethod === 'Manual Form' ? 'default' : 'outline'}
//                   onClick={() => {
//                     setCreationMethod('Manual Form');
//                   }}
//                   className="flex-1 py-4 px-4"
//                 >
//                   Manual Form
//                 </Button>
//                 <Button
//                   variant={creationMethod === 'File Upload' ? 'default' : 'outline'}
//                   onClick={() => {
//                     setCreationMethod('File Upload');
//                   }}
//                   className="flex-1 py-4 px-4"
//                 >
//                   File Upload
//                 </Button>
//               </div>
//             </div>

//             <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
//               <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
//                 Select Deck
//               </h2>
//               <div className="space-y-2">
//                 <Label htmlFor="select-deck" className="text-gray-700 dark:text-gray-300">
//                   Choose an existing deck
//                 </Label>
//                 <select
//                   id="select-deck"
//                   value={selectedDeckId || ''}
//                   onChange={(e) => setSelectedDeckId(Number(e.target.value))}
//                   className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring focus:border-blue-300"
//                 >
//                   <option value="">Choose a deck...</option>
//                   {decks.map((deck) => (
//                     <option key={deck.id} value={deck.id}>
//                       {deck.title}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {creationMethod === 'Manual Form' && (
//               <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
//                 <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
//                   {editingCard ? 'Edit Card' : 'Manual Card Creation'}
//                 </h2>
//                 <div className="space-y-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="question" className="text-gray-700 dark:text-gray-300">
//                       Question
//                     </Label>
//                     <Input
//                       id="question"
//                       placeholder="Enter your question..."
//                       value={question}
//                       onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
//                     />
//                     <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
//                       {question.length}/{MAX_QUESTION_LENGTH}
//                     </span>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="answer" className="text-gray-700 dark:text-gray-300">
//                       Answer
//                     </Label>
//                     <Textarea
//                       id="answer"
//                       placeholder="Enter the answer..."
//                       value={answer}
//                       onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
//                       className="resize-none"
//                     />
//                     <span className="text-xs text-gray-500 dark:text-gray-500 float-right">
//                       {answer.length}/{MAX_ANSWER_LENGTH}
//                     </span>
//                   </div>
//                   <div className="flex justify-end pt-4">
//                     <Button
//                       variant="outline"
//                       className="mr-2"
//                       onClick={() => {
//                         setViewingCards(true);
//                         setEditingCard(null);
//                       }}
//                     >
//                       Cancel
//                     </Button>
//                     <Button onClick={editingCard ? handleEditSave : handleManualSave} disabled={selectedDeckId === null || userId === null}>
//                       {editingCard ? 'Save Changes' : 'Save Card'}
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}
//             {/* File Upload Section */}
//             {creationMethod === 'File Upload' && (
//               <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
//                 <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
//                   Bulk Upload from File
//                 </h2>
//                 <div className="space-y-6">
//                   <div className="space-y-2">
//                     <Label
//                       htmlFor="file-upload"
//                       className="text-gray-700 dark:text-gray-300"
//                     >
//                       Upload File (.txt)
//                     </Label>
//                     <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
//                       {!file ? (
//                         <>
//                           <FileText className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto" />
//                           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//                             Select a .txt file with your cards
//                           </p>
//                           <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
//                             Format: Question|Answer|Difficulty (one card per
//                             line)
//                           </p>
//                           <p className="text-xs text-gray-400 dark:text-gray-500">
//                             Example: What is 2+2?|4|Easy
//                           </p>
//                           <label
//                             htmlFor="file-upload-input"
//                             className="mt-4 inline-flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
//                           >
//                             Choose file
//                           </label>
//                           <input
//                             id="file-upload-input"
//                             type="file"
//                             accept=".txt"
//                             onChange={handleFileChange}
//                             className="hidden"
//                           />
//                         </>
//                       ) : (
//                         <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
//                           <div className="flex items-center">
//                             <FileText className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
//                             <span className="text-sm text-gray-700 dark:text-gray-300">
//                               {file.name}
//                             </span>
//                           </div>
//                           <button
//                             onClick={handleRemoveFile}
//                             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//                           >
//                             <X className="h-4 w-4" />
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex justify-end pt-4">
//                     <Button variant="outline" className="mr-2">
//                       Cancel
//                     </Button>
//                     <Button
//                       onClick={handleBulkUpload}
//                       disabled={!file}
//                     >
//                       Create Cards
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Instructions Section */}
//             <div className="mt-8 p-6 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
//               <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
//                 <span className="text-yellow-500 mr-2">💡</span>Instructions
//               </h3>
//               <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
//                 <strong className="text-gray-800 dark:text-gray-200">
//                   Manual Form:
//                 </strong>{' '}
//                 Create cards one by one using the form above.
//               </p>
//               <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
//                 <strong className="text-gray-800 dark:text-gray-200">
//                   File Upload:
//                 </strong>{' '}
//                 Upload a .txt file with multiple cards at once.
//               </p>
//               <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
//                 <strong className="text-gray-800 dark:text-gray-200">
//                   File Format:
//                 </strong>{' '}
//                 Each line should contain: Question|Answer|Difficulty
//               </p>
//               <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
//                 <strong className="text-gray-800 dark:text-gray-200">
//                   Example file contents:
//                 </strong>
//               </p>
//               <pre className="mt-2 text-xs border border-gray-200 dark:border-gray-700 p-3 rounded-md text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
//                 What is the capital of France?|Paris|Easy How do you say hello
//                 in Spanish?|Hola|Easy What is 15 x 12?|180|Medium
//               </pre>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, X, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { getDecks } from '@/lib/deck-service';
import {
  createCard,
  updateCard,
  deleteCard,
  getCardsByUserId,
} from '@/lib/card-service';

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

const CARDS_PER_PAGE = 4;
const MAX_QUESTION_LENGTH = 150;
const MAX_ANSWER_LENGTH = 300;

export default function CreateNewCard() {
  const [creationMethod, setCreationMethod] = useState('Manual Form');
  const [cards, setCards] = useState<CardData[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [viewingCards, setViewingCards] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckData[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  const getCurrentUserId = (): number => {
    return 1; // Example user ID
  };

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

  const fetchCardsWithPagination = async (newPage: number) => {
    try {
      setLoading(true);
      const response = await getCardsByUserId(
        newPage,
        CARDS_PER_PAGE,
        selectedDeckId || undefined
      );
      setCards(response.data.data || []);
      setTotalPages(response.data.meta.totalPages);
      setPage(newPage);
      setError(null);
    } catch (err) {
      setError('Failed to fetch cards. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
    setUserId(getCurrentUserId());
  }, []);

  useEffect(() => {
    if (viewingCards) {
      fetchCardsWithPagination(page);
    }
  }, [viewingCards, page, selectedDeckId]);

  const isValidInput = (input: string) => {
    return input.trim().length > 0;
  };

  const handleManualSave = async () => {
    if (
      !isValidInput(question) ||
      !isValidInput(answer) ||
      selectedDeckId === null ||
      userId === null
    ) {
      alert('Please fill out all required fields.');
      return;
    }

    const newCardPayload = {
      frontContent: question,
      backContent: answer,
      deckId: selectedDeckId,
      userId,
    };

    try {
      const response = await createCard(newCardPayload);
      if (response && response.newCard) {
        setCards([...cards, response.newCard]);
      }
      setQuestion('');
      setAnswer('');
      setViewingCards(true);
      setError(null);
      // Re-fetch to ensure pagination is correct
      fetchCardsWithPagination(1);
    } catch (err) {
      setError('Failed to save card. Please try again.');
      console.error(err);
    }
  };

  const handleEdit = (card: CardData) => {
    setEditingCard(card);
    setQuestion(card.frontContent);
    setAnswer(card.backContent);
    setSelectedDeckId(card.deckId);
    setViewingCards(false);
  };

  const handleEditSave = async () => {
    if (editingCard) {
      if (
        !isValidInput(question) ||
        !isValidInput(answer) ||
        selectedDeckId === null
      ) {
        alert('Please fill out all required fields before saving.');
        return;
      }
      const updatedCardPayload = {
        frontContent: question,
        backContent: answer,
      };

      try {
        const response = await updateCard(editingCard.id, updatedCardPayload);
        if (response && response.updatedCard) {
          const updatedCards = cards.map((card) =>
            card.id === editingCard.id ? response.updatedCard : card
          );
          setCards(updatedCards);
        }
        setEditingCard(null);
        setQuestion('');
        setAnswer('');
        setSelectedDeckId(null);
        setViewingCards(true);
        setError(null);
        // Re-fetch to ensure pagination is correct
        fetchCardsWithPagination(page);
      } catch (err) {
        setError('Failed to update card. Please try again.');
        console.error(err);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCard(id);
      const updatedCards = cards.filter((card) => card.id !== id);
      setCards(updatedCards);
      setError(null);
      // Re-fetch to ensure pagination is correct
      fetchCardsWithPagination(updatedCards.length === 0 ? 1 : page);
    } catch (err) {
      setError('Failed to delete card. Please try again.');
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
    if (!file || selectedDeckId === null || userId === null) {
      alert('Please select a file and a deck.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      const newCards = [];

      for (const line of lines) {
        const [frontContent, backContent] = line
          .split('|')
          .map((item) => item.trim());
        if (isValidInput(frontContent) && isValidInput(backContent)) {
          const newCardPayload = {
            frontContent,
            backContent,
            deckId: selectedDeckId,
            userId,
          };
          try {
            const response = await createCard(newCardPayload);
            if (response && response.newCard) {
              newCards.push(response.newCard);
            }
          } catch (err) {
            console.error('Failed to upload a card:', err);
          }
        }
      }
      setCards((prevCards) => [...prevCards, ...newCards]);
      setFile(null);
      setViewingCards(true);
      setError(null);
      // Re-fetch to ensure pagination is correct
      fetchCardsWithPagination(1);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto rounded-lg shadow-xl border bg-white/45 dark:bg-black/40 p-8">
        <h1
          className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2 cursor-pointer"
          onClick={() => {
            setViewingCards(!viewingCards);
          }}
        >
          <span className="text-gray-500 font-bold">
            <ArrowLeft className="inline-block h-6 w-6 mr-2" />
          </span>
          {viewingCards ? 'Your Flashcards' : 'Create New Card'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Add flashcards to your collection
        </p>

        {viewingCards ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
              Your Flashcards
            </h2>
            {loading ? (
              <div className="text-center text-gray-500">Loading cards...</div>
            ) : cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500 dark:text-gray-400">
                <FileText className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium">
                  No flashcards created yet.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cards.map((card) => (
                    <Card key={card.id} className="rounded-lg shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100 break-words">
                          {card.frontContent}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 mb-2 break-words">
                          {card.backContent}
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

                <div className="flex justify-center mt-6 space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchCardsWithPagination(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => fetchCardsWithPagination(page + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
            <div className="flex justify-end mt-6">
              <Button onClick={() => setViewingCards(false)}>
                Add New Card
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8 shadow-sm">
              <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Choose Creation Method
              </h2>
              <div className="flex gap-4">
                <Button
                  variant={
                    creationMethod === 'Manual Form' ? 'default' : 'outline'
                  }
                  onClick={() => {
                    setCreationMethod('Manual Form');
                  }}
                  className="flex-1 py-4 px-4"
                >
                  Manual Form
                </Button>
                <Button
                  variant={
                    creationMethod === 'File Upload' ? 'default' : 'outline'
                  }
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
                  {editingCard ? 'Edit Card' : 'Manual Card Creation'}
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
                      disabled={selectedDeckId === null || userId === null}
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
                    <Button variant="outline" className="mr-2">
                      Cancel
                    </Button>
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
          </>
        )}
      </div>
    </div>
  );
}
