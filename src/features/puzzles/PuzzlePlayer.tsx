import React, { useState, useEffect } from 'react';
import styles from './style.module.css';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectSelectedPuzzle } from './slice';
import { navigateToList } from '../app/slice';
import { selectUser } from '../auth/slice';
import { getGameState, saveGameState } from '../../firebase/firestore';

interface SolvedCategory {
    name: string;
    words: string[];
    categoryIndex: number;
    isFaded?: boolean;
}

// Helper function to convert a guess (set of 4 words) to a 16-bit number
// The bit position is determined by the word's position in the puzzle.words array
const guessToNumber = (selectedWords: string[], allWords: string[]): number => {
    let result = 0;
    selectedWords.forEach(word => {
        const index = allWords.indexOf(word);
        if (index !== -1) {
            result |= (1 << index);
        }
    });
    return result;
};

// Helper function to convert a 16-bit number back to a set of word indices
const numberToWordIndices = (guessNumber: number): number[] => {
    const indices: number[] = [];
    for (let i = 0; i < 16; i++) {
        if (guessNumber & (1 << i)) {
            indices.push(i);
        }
    }
    return indices;
};

// Helper function to check if a guess matches a category
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    const categoryMask = 0b1111 << (categoryIndex * 4);
    const guessMasked = guessNumber & categoryMask;
    return guessMasked === categoryMask && (guessNumber & ~categoryMask) === 0;
};

const PuzzlePlayer = () => {
    const dispatch = useAppDispatch();
    const selectedPuzzle = useAppSelector(selectSelectedPuzzle);
    const currentUser = useAppSelector(selectUser);
    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [solvedCategories, setSolvedCategories] = useState<SolvedCategory[]>([]);
    const [mistakesRemaining, setMistakesRemaining] = useState(4);
    const [isRevealing, setIsRevealing] = useState(false);
    const [revealIndex, setRevealIndex] = useState(0);
    const [shakingWords, setShakingWords] = useState<Set<string>>(new Set());
    const [guessHistory, setGuessHistory] = useState<Set<string>>(new Set());
    const [duplicateGuessMessage, setDuplicateGuessMessage] = useState(false);
    const [guessNumbers, setGuessNumbers] = useState<number[]>([]); // Track guesses as 16-bit numbers
    const [isLoadingGameState, setIsLoadingGameState] = useState(false);

    // Load game state from Firestore when component mounts or puzzle changes
    useEffect(() => {
        const loadGameState = async () => {
            if (!selectedPuzzle?.id || !currentUser?.uid) return;

            setIsLoadingGameState(true);
            const { gameState, error } = await getGameState(currentUser.uid, selectedPuzzle.id);

            if (error) {
                console.error('Error loading game state:', error);
                setIsLoadingGameState(false);
                return;
            }

            if (gameState && gameState.guesses.length > 0) {
                // Restore game state from saved guesses
                const savedGuesses = gameState.guesses;
                setGuessNumbers(savedGuesses);

                // Reconstruct the game state from the saved guesses
                const solved: SolvedCategory[] = [];
                const incorrectGuesses: number[] = [];
                const allGuessKeys = new Set<string>();

                savedGuesses.forEach(guessNumber => {
                    // Check if this guess was correct
                    let wasCorrect = false;
                    for (let categoryIndex = 0; categoryIndex < selectedPuzzle.categories.length; categoryIndex++) {
                        if (isGuessCorrect(guessNumber, categoryIndex)) {
                            const categoryWords = selectedPuzzle.words.slice(categoryIndex * 4, (categoryIndex + 1) * 4);
                            const sortedWords = [...categoryWords].sort();
                            solved.push({
                                name: selectedPuzzle.categories[categoryIndex],
                                words: sortedWords,
                                categoryIndex
                            });
                            wasCorrect = true;
                            break;
                        }
                    }

                    if (!wasCorrect) {
                        incorrectGuesses.push(guessNumber);
                    }

                    // Add to guess history
                    const wordIndices = numberToWordIndices(guessNumber);
                    const words = wordIndices.map(i => selectedPuzzle.words[i]);
                    const guessKey = [...words].sort().join('|');
                    allGuessKeys.add(guessKey);
                });

                // Set the solved categories
                setSolvedCategories(solved);

                // Set mistakes remaining based on incorrect guesses
                const mistakes = Math.max(0, 4 - incorrectGuesses.length);
                setMistakesRemaining(mistakes);

                // Set guess history
                setGuessHistory(allGuessKeys);

                // Set shuffled words (excluding solved category words)
                const solvedWords = new Set(solved.flatMap(cat => cat.words));
                const remainingWords = selectedPuzzle.words.filter(word => !solvedWords.has(word));
                const shuffled = [...remainingWords].sort(() => Math.random() - 0.5);
                setShuffledWords(shuffled);
            } else {
                // No saved game state, start fresh
                const shuffled = [...selectedPuzzle.words].sort(() => Math.random() - 0.5);
                setShuffledWords(shuffled);
                setSelectedWords(new Set());
                setSolvedCategories([]);
                setMistakesRemaining(4);
                setGuessNumbers([]);
                setGuessHistory(new Set());
            }

            setIsRevealing(false);
            setRevealIndex(0);
            setDuplicateGuessMessage(false);
            setSelectedWords(new Set());
            setIsLoadingGameState(false);
        };

        loadGameState();
    }, [selectedPuzzle, currentUser]);

    // Trigger reveal animation when game is lost
    useEffect(() => {
        if (mistakesRemaining === 0 && !isRevealing && selectedPuzzle) {
            setIsRevealing(true);

            // Start revealing unsolved categories one by one
            const revealNextCategory = (index: number) => {
                if (index >= selectedPuzzle.categories.length) {
                    return;
                }

                // Check if this category is already solved
                const isSolved = solvedCategories.some(cat => cat.categoryIndex === index);
                if (isSolved) {
                    // Skip to next category
                    setTimeout(() => revealNextCategory(index + 1), 100);
                    return;
                }

                // Get the category words
                const categoryWords = selectedPuzzle.words.slice(index * 4, (index + 1) * 4);
                const sortedWords = [...categoryWords].sort();

                // Rearrange shuffledWords to put category words at the top
                setShuffledWords(prev => {
                    const newOrder = [...categoryWords];
                    const remaining = prev.filter(w => !categoryWords.includes(w));
                    return [...newOrder, ...remaining];
                });

                // After animation completes, add to solved categories with fade
                setTimeout(() => {
                    setSolvedCategories(prevSolved => [...prevSolved, {
                        name: selectedPuzzle.categories[index],
                        words: sortedWords,
                        categoryIndex: index,
                        isFaded: true
                    }]);

                    // Remove these words from shuffled words
                    setShuffledWords(prev => prev.filter(word => !categoryWords.includes(word)));

                    // Reveal next category
                    if (index + 1 < selectedPuzzle.categories.length) {
                        setTimeout(() => revealNextCategory(index + 1), 800);
                    }
                }, 800);
            };

            // Start the reveal sequence after a short delay
            setTimeout(() => revealNextCategory(0), 500);
        }
    }, [mistakesRemaining, selectedPuzzle, solvedCategories, isRevealing]);

    const handleWordClick = (word: string) => {
        setSelectedWords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(word)) {
                newSet.delete(word);
            } else if (newSet.size < 4) {
                // Only allow selecting if less than 4 words are selected
                newSet.add(word);
            }
            return newSet;
        });
    };

    const handleShuffle = () => {
        const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
        setShuffledWords(shuffled);
    };

    const handleDeselectAll = () => {
        setSelectedWords(new Set());
    };

    const handleSubmit = async () => {
        if (!selectedPuzzle || selectedWords.size !== 4 || !currentUser?.uid || !selectedPuzzle.id) return;

        const selectedWordsArray = Array.from(selectedWords);

        // Create a normalized guess key (sorted words joined with a delimiter)
        // This ensures that the same 4 words in any order produce the same key
        const guessKey = [...selectedWordsArray].sort().join('|');

        // Check if this guess has been made before
        if (guessHistory.has(guessKey)) {
            // Duplicate guess! Show message and don't deduct mistake
            setDuplicateGuessMessage(true);
            setSelectedWords(new Set()); // Deselect the words
            setTimeout(() => {
                setDuplicateGuessMessage(false);
            }, 2000);
            return;
        }

        // Convert the guess to a 16-bit number
        const guessNumber = guessToNumber(selectedWordsArray, selectedPuzzle.words);

        // Add to guess numbers for saving
        const updatedGuessNumbers = [...guessNumbers, guessNumber];
        setGuessNumbers(updatedGuessNumbers);

        // Add this guess to history
        setGuessHistory(prev => {
            const newHistory = new Set(prev);
            newHistory.add(guessKey);
            return newHistory;
        });

        // Check each category to see if it matches the selected words
        // Each category has 4 words, and the words array is structured as:
        // [cat1_word1, cat1_word2, cat1_word3, cat1_word4, cat2_word1, ...]
        for (let i = 0; i < selectedPuzzle.categories.length; i++) {
            const categoryWords = selectedPuzzle.words.slice(i * 4, (i + 1) * 4);

            // Check if all selected words are in this category
            const isMatch = categoryWords.every(word => selectedWords.has(word)) &&
                           selectedWordsArray.every(word => categoryWords.includes(word));

            if (isMatch) {
                // Correct match! Add to solved categories
                const sortedWords = [...categoryWords].sort();
                setSolvedCategories(prev => [...prev, {
                    name: selectedPuzzle.categories[i],
                    words: sortedWords,
                    categoryIndex: i
                }]);

                // Remove these words from the shuffled words
                setShuffledWords(prev => prev.filter(word => !categoryWords.includes(word)));

                // Clear selection
                setSelectedWords(new Set());

                // Save game state to Firestore
                await saveGameState({
                    userId: currentUser.uid,
                    puzzleId: selectedPuzzle.id,
                    guesses: updatedGuessNumbers
                });

                return;
            }
        }

        // If we get here, no match was found - incorrect guess
        // Trigger shake animation
        setShakingWords(new Set(selectedWords));

        // After shake animation completes (500ms), deselect and remove mistake
        setTimeout(async () => {
            setShakingWords(new Set());
            setSelectedWords(new Set());
            setMistakesRemaining(prev => prev - 1);

            // Save game state to Firestore
            await saveGameState({
                userId: currentUser.uid,
                puzzleId: selectedPuzzle.id!,
                guesses: updatedGuessNumbers
            });
        }, 500);
    };

    const handleBack = () => {
        dispatch(navigateToList());
    };

    if (!selectedPuzzle) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>No puzzle selected</p>
                <button onClick={handleBack}>Back to List</button>
            </div>
        );
    }

    if (isLoadingGameState) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>Loading game state...</p>
            </div>
        );
    }

    // Format creator name and date
    const creatorName = currentUser?.displayName || currentUser?.email || 'Unknown';
    const createdDate = selectedPuzzle.createdAt
        ? new Date(selectedPuzzle.createdAt.toDate()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown date';

    const isGameLost = mistakesRemaining === 0;
    const isComplete = solvedCategories.length === 4 && !isGameLost;

    return (
        <div className={styles.puzzlePlayerContainer}>
            <div className={styles.puzzlePlayerHeader}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← Back to List
                </button>
                <h2>{creatorName}</h2>
                <p className={styles.createdDate}>{createdDate}</p>
            </div>

            <div className={styles.wordGrid}>
                {/* Show solved categories at the top */}
                {solvedCategories.map((category, index) => (
                    <div
                        key={index}
                        className={`${styles.solvedCategoryRow} ${category.isFaded ? styles.fadedCategory : ''}`}
                        data-category-index={category.categoryIndex}
                    >
                        <div className={styles.categoryName}>{category.name}</div>
                        <div className={styles.categoryWords}>
                            {category.words.join(', ')}
                        </div>
                    </div>
                ))}

                {/* Show remaining words */}
                {shuffledWords.map((word, index) => (
                    <button
                        key={index}
                        className={`${styles.wordButton} ${selectedWords.has(word) ? styles.selectedWord : ''} ${shakingWords.has(word) ? styles.shakeWord : ''}`}
                        onClick={() => handleWordClick(word)}
                        disabled={isGameLost}
                    >
                        {word}
                    </button>
                ))}
            </div>

            {!isComplete && !isGameLost && (
                <div className={styles.mistakesContainer}>
                    <span className={styles.mistakesLabel}>Mistakes remaining:</span>
                    <div className={styles.mistakesDots}>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <span
                                key={index}
                                className={`${styles.mistakeDot} ${index < mistakesRemaining ? styles.mistakeDotActive : ''}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {duplicateGuessMessage && (
                <div className={styles.duplicateGuessMessage}>
                    Already guessed!
                </div>
            )}

            {isComplete ? (
                <div className={styles.congratulations}>
                    🎉 Congratulations! You solved the puzzle! 🎉
                </div>
            ) : isGameLost ? (
                <div className={styles.gameOver}>
                    Better luck next time!
                </div>
            ) : (
                <div className={styles.actionButtons}>
                    <button className={styles.actionButton} onClick={handleShuffle}>
                        Shuffle
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={handleDeselectAll}
                        disabled={selectedWords.size === 0}
                    >
                        Deselect all
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={handleSubmit}
                        disabled={selectedWords.size !== 4}
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
};

export default PuzzlePlayer;

