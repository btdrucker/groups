import React, {useState, useEffect} from 'react';
import styles from './style.module.css';
import {useAppSelector} from '../../common/hooks';
import {selectPuzzle} from './slice';
import {selectUserId} from '../auth/slice';
import {getGameState, saveGameState} from '../../firebase/firestore';
import {useParams} from 'react-router-dom';

interface SolvedCategory {
    name: string;
    words: string[];
    categoryIndex: number;
    isFaded?: boolean;
}

// Converts a guess (set of 4 words) to a 16-bit number
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

// Converts a 16-bit number back to a set of word indices
const numberToWordIndices = (guessNumber: number): number[] => {
    const indices: number[] = [];
    for (let i = 0; i < 16; i++) {
        if (guessNumber & (1 << i)) {
            indices.push(i);
        }
    }
    return indices;
};

// Checks if a guess matches a category
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    const categoryMask = 0b1111 << (categoryIndex * 4);
    const guessMasked = guessNumber & categoryMask;
    return guessMasked === categoryMask && (guessNumber & ~categoryMask) === 0;
};

// Returns true if exactly three out of four selected words are in any unsolved category
function isOneAway(
    selectedWords: Set<string>,
    puzzle: { categories: string[]; words: string[] },
    solvedCategories: SolvedCategory[] = []
): boolean {
    if (selectedWords.size !== 4) return false;
    const solvedIndices = new Set(solvedCategories.map(cat => cat.categoryIndex));
    for (let i = 0; i < puzzle.categories.length; i++) {
        if (solvedIndices.has(i)) continue;
        const categoryWords = puzzle.words.slice(i * 4, (i + 1) * 4);
        const matchCount = categoryWords.filter(word => selectedWords.has(word)).length;
        if (matchCount === 3) return true;
    }
    return false;
}

const Play = () => {
    const currentPuzzle = useAppSelector(selectPuzzle);
    const userId = useAppSelector(selectUserId);
    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [solvedCategories, setSolvedCategories] = useState<SolvedCategory[]>([]);
    const [mistakesRemaining, setMistakesRemaining] = useState(4);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isShakingWords, setIsShakingWords] = useState<Set<string>>(new Set());
    const [isShowingMessage, setIsShowingMessage] = useState(false);
    const [messageText, setMessageText] = useState<string | null>(null);
    const [guesses, setGuesses] = useState<number[]>([]); // Track guesses as 16-bit numbers from gameState
    const [isLoadingGameState, setIsLoadingGameState] = useState(false);
    const {puzzleId} = useParams();
    const [loadError, setLoadError] = useState(false);

    // Checks if a guess (as sorted string key) exists in guessNumbers
    const hasDuplicateGuess = (guessKey: string): boolean => {
        if (!currentPuzzle) return false;
        return guesses.some(guessNumber => {
            const wordIndices = numberToWordIndices(guessNumber);
            const words = wordIndices.map(i => currentPuzzle.words[i]);
            const key = [...words].sort().join('|');
            return key === guessKey;
        });
    };

    // Load game state from Firestore when component mounts or puzzle changes
    useEffect(() => {
        const loadGameState = async () => {
            if (!currentPuzzle || !currentPuzzle.id || !userId) return;

            setIsLoadingGameState(true);
            const {gameState, error} = await getGameState(userId, currentPuzzle.id);

            if (error) {
                console.error('Error loading game state:', error);
                setIsLoadingGameState(false);
                setLoadError(true);
                return;
            }

            if (gameState && gameState.guesses.length > 0) {
                setGuesses(gameState.guesses);

                // Reconstruct the game state from the saved guesses
                const solved: SolvedCategory[] = [];
                const incorrectGuesses: number[] = [];

                gameState.guesses.forEach(guessNumber => {
                    // Check if this guess was correct
                    let wasCorrect = false;
                    for (let categoryIndex = 0; categoryIndex < currentPuzzle.categories.length; categoryIndex++) {
                        if (isGuessCorrect(guessNumber, categoryIndex)) {
                            const categoryWords = currentPuzzle.words.slice(categoryIndex * 4, (categoryIndex + 1) * 4);
                            const sortedWords = [...categoryWords].sort();
                            solved.push({
                                name: currentPuzzle.categories[categoryIndex],
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
                });

                // Set the solved categories
                setSolvedCategories(solved);

                // Set mistakes remaining based on incorrect guesses
                const mistakes = Math.max(0, 4 - incorrectGuesses.length);
                setMistakesRemaining(mistakes);

                // Set shuffled words (excluding solved category words)
                const solvedWords = new Set(solved.flatMap(cat => cat.words));
                const remainingWords = currentPuzzle.words.filter(word => !solvedWords.has(word));
                const shuffled = [...remainingWords].sort(() => Math.random() - 0.5);
                setShuffledWords(shuffled);
            } else {
                // No saved game state, start fresh
                const shuffled = [...currentPuzzle.words].sort(() => Math.random() - 0.5);
                setShuffledWords(shuffled);
                setSelectedWords(new Set());
                setSolvedCategories([]);
                setMistakesRemaining(4);
                setGuesses([]);
            }
            setIsRevealing(false);
            setIsShowingMessage(false);
            setSelectedWords(new Set());
            setIsLoadingGameState(false);
        };
        loadGameState();
    }, [currentPuzzle, userId]);

    // Trigger reveal animation when game is lost
    useEffect(() => {
        if (mistakesRemaining === 0 && !isRevealing && currentPuzzle) {
            setIsRevealing(true);

            // Start revealing unsolved categories one by one
            const revealNextCategory = (index: number) => {
                if (!currentPuzzle || index >= currentPuzzle.categories.length) {
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
                const categoryWords = currentPuzzle.words.slice(index * 4, (index + 1) * 4);
                const sortedWords = [...categoryWords].sort();

                // Rearrange shuffledWords to put category words at the top
                setShuffledWords(prev => {
                    const newOrder = [...categoryWords];
                    const remaining = prev.filter(w => !categoryWords.includes(w));
                    return [...newOrder, ...remaining];
                });

                // After animation completes, add to solved categories with fade
                setTimeout(() => {
                    if (!currentPuzzle) return;

                    setSolvedCategories(prevSolved => [...prevSolved, {
                        name: currentPuzzle.categories[index],
                        words: sortedWords,
                        categoryIndex: index,
                        isFaded: true
                    }]);

                    // Remove these words from shuffled words
                    setShuffledWords(prev => prev.filter(word => !categoryWords.includes(word)));

                    // Reveal next category
                    if (index + 1 < currentPuzzle.categories.length) {
                        setTimeout(() => revealNextCategory(index + 1), 800);
                    }
                }, 800);
            };

            // Start the reveal sequence after a short delay
            setTimeout(() => revealNextCategory(0), 500);
        }
    }, [mistakesRemaining, currentPuzzle, solvedCategories, isRevealing]);

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
        if (selectedWords.size !== 4 || !userId || !currentPuzzle?.id) return;

        const selectedWordsArray = Array.from(selectedWords);
        const guessKey = [...selectedWordsArray].sort().join('|');
        const isOneAwayGuess = isOneAway(selectedWords, currentPuzzle);

        if (hasDuplicateGuess(guessKey)) {
            setMessageText(isOneAwayGuess ? 'Already guessed (One away)!' : 'Already guessed!');
            setIsShowingMessage(true);
            setSelectedWords(new Set());
            setTimeout(() => {
                setIsShowingMessage(false);
                setMessageText(null);
            }, 2000);
            return;
        }

        if (isOneAwayGuess) {
            setIsShakingWords(new Set(selectedWords));
            setTimeout(() => {
                setIsShakingWords(new Set());
                setMessageText('One away!');
                setIsShowingMessage(true);
                setSelectedWords(new Set());
                setTimeout(() => {
                    setIsShowingMessage(false);
                    setMessageText(null);
                }, 2000);
            }, 500);
            return;
        }

        // Convert the guess to a 16-bit number
        const guessNumber = guessToNumber(selectedWordsArray, currentPuzzle.words);

        // Add to guesses for saving
        const updatedGuesses = [...guesses, guessNumber];
        setGuesses(updatedGuesses);

        // Check each category to see if it matches the selected words
        // Each category has 4 words, and the words array is structured as:
        // [cat1_word1, cat1_word2, cat1_word3, cat1_word4, cat2_word1, ...]
        for (let i = 0; i < currentPuzzle.categories.length; i++) {
            const categoryWords = currentPuzzle.words.slice(i * 4, (i + 1) * 4);

            // Check if all selected words are in this category
            const isMatch = categoryWords.every(word => selectedWords.has(word)) &&
                selectedWordsArray.every(word => categoryWords.includes(word));

            if (isMatch) {
                // Correct match! Add to solved categories
                const sortedWords = [...categoryWords].sort();
                setSolvedCategories(prev => [...prev, {
                    name: currentPuzzle.categories[i],
                    words: sortedWords,
                    categoryIndex: i
                }]);

                // Remove these words from the shuffled words
                setShuffledWords(prev => prev.filter(word => !categoryWords.includes(word)));

                // Clear selection
                setSelectedWords(new Set());

                // Save game state to Firestore
                await saveGameState({
                    userId: userId,
                    puzzleId: currentPuzzle.id,
                    guesses: updatedGuesses
                });

                return;
            }
        }

        // If we get here, no match was found - incorrect guess
        // Trigger shake animation
        setIsShakingWords(new Set(selectedWords));

        // After shake animation completes (500ms), deselect and remove mistake
        setTimeout(async () => {
            setIsShakingWords(new Set());
            setSelectedWords(new Set());
            setMistakesRemaining(prev => prev - 1);

            // Save game state to Firestore
            await saveGameState({
                userId: userId,
                puzzleId: currentPuzzle.id!,
                guesses: updatedGuesses
            });
        }, 500);
    };

    // Conditional rendering for loading, error, not found
    if (isLoadingGameState) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>Loading...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>There was an error loading the puzzle.</p>
            </div>
        );
    }

    if (!isLoadingGameState && puzzleId && !currentPuzzle) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>I can't find that puzzle!</p>
            </div>
        );
    }

    // Format creator name and date
    if (!currentPuzzle) return null; // Defensive, should never hit due to above guards
    // const creatorName = currentPuzzle.creatorDisplayName || currentPuzzle.creatorEmail || 'Unknown';
    const createdDate = currentPuzzle.createdAt
        ? new Date(currentPuzzle.createdAt).toLocaleDateString('en-US', {
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
                {/* <h2>{creatorName}</h2> */}
                <p className={styles.createdDate}>{createdDate}</p>
            </div>

            <div className={styles.wordGrid}>
                {/* Overlay message if active */}
                {isShowingMessage && (
                    <div className={styles.duplicateGuessMessageOverlay}>
                        <div className={styles.duplicateGuessMessage}>
                            {messageText}
                        </div>
                    </div>
                )}
                {/* Show solved categories at the top */}
                {solvedCategories.map((category, index) => (
                    <div
                        key={index}
                        className={`${styles.solvedCategoryRow} ${category.isFaded ? styles.missedCategory : ''}`}
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
                        className={`${styles.wordButton} ${selectedWords.has(word) ? styles.selectedWord : ''} ${isShakingWords.has(word) ? styles.shakeWord : ''}`}
                        onClick={() => handleWordClick(word)}
                        disabled={isGameLost}
                    >
                        {word}
                    </button>
                ))}
            </div>

            <div className={styles.mistakesContainer}>
                <span className={styles.mistakesLabel}>Mistakes remaining:</span>
                <div className={styles.mistakesDots}>
                    {Array.from({length: 4}).map((_, index) => (
                        <span
                            key={index}
                            className={`${styles.mistakeDot} ${index < mistakesRemaining ? styles.mistakeDotActive : ''}`}
                        />
                    ))}
                </div>
            </div>

            {isComplete ? (
                <div className={styles.congratulations}>
                    🎉 Congratulations! You solved the puzzle! 🎉
                </div>
            ) : isGameLost ? (
                <div className={styles.gameOver}>
                    Better luck next time!
                </div>
            ) : (
                <div className={styles.buttonRow}>
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

export default Play;

