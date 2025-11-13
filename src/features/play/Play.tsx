import React, {useEffect, useState} from 'react';
import styles from './style.module.css';
import {useAppSelector} from '../../common/hooks';
import {selectPuzzle} from './slice';
import {selectUserId} from '../auth/slice';
import {getGameState, Puzzle, saveGameState} from '../../firebase/firestore';
import {useParams} from 'react-router-dom';

interface SolvedCategory {
    categoryIndex: number;
    wasNotGuessed?: boolean;
}

interface Word {
    word: string;
    indexInGrid: number;
}

// Converts a guess (set of 4 words) to a 16-bit number.
// The bit position is determined by the word's position in the puzzle's words array.
const guessToNumber = (guess: Word[]): number => {
    let result = 0;
    guess.forEach((word, index) => result |= (1 << index));
    return result;
};

// Counts the number of set bits in a 16-bit numbers.
const countSetBits = (n: number): number => {
    let count = 0;
    while (n) {
        if (n & 1) count++;
        n >>= 1;
    }
    return count;
}

const correctWordsForCategory = (guessNumber: number, categoryIndex: number): number => {
    const categoryMask = 0b1111 << (categoryIndex * 4);
    const guessMasked = guessNumber & categoryMask;
    return countSetBits(guessMasked);
}

// Checks if a guess matches a category.
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    return correctWordsForCategory(guessNumber, categoryIndex) === 4;
};

// Returns true if exactly three out of four selected words are in any unsolved category
function isOneAway(guessNumber: number, puzzle: Puzzle): boolean {
    for (let categoryIndex = 0; categoryIndex < puzzle.categories.length; categoryIndex++) {
        if (correctWordsForCategory(guessNumber, categoryIndex) === 3) {
            return true;
        }
    }
    return false;
}

// Checks if a guess number already exists in guesses.
const isDuplicateGuess = (guessNumber: number, guesses: number[]): boolean => {
    return guesses.includes(guessNumber);
};

const Play = () => {
    const {puzzleId} = useParams();
    const currentPuzzle = useAppSelector(selectPuzzle);
    const userId = useAppSelector(selectUserId);
    const [guesses, setGuesses] = useState<number[]>([]); // Track guesses as 16-bit numbers from gameState
    const [selectedWords, setSelectedWords] = useState<Word[]>([]);
    const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
    const [solvedCategories, setSolvedCategories] = useState<SolvedCategory[]>([]);
    const [mistakesRemaining, setMistakesRemaining] = useState(4);
    const [shakingWords, setShakingWords] = useState<Word[]>([]);
    const [messageText, setMessageText] = useState<string | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isLoadingGameState, setIsLoadingGameState] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const shuffleWords = (words: Word[], solvedCategories: SolvedCategory[], numCategories: number, wordsPerCategory: number): Word[] => {
        // Deep copy words array.
        const wordList = words.map(word => ({...word}));

        // Place words of solved categories on the top rows, in the order the categories were solved.
        solvedCategories.forEach((cat, solvedIndex) => {
            for (let x = 0; x < wordsPerCategory; x++) {
                const indexInPuzzle = cat.categoryIndex * wordsPerCategory + x;
                const word = wordList[indexInPuzzle];
                word.indexInGrid = solvedIndex * wordsPerCategory + x;
            }
        })

        // Make an array of remaining indices in grid, randomly sorted.
        let remainingIndices = Array.from(
            {length: (numCategories - solvedCategories.length) * wordsPerCategory},
            (_, i) => i + solvedCategories.length * wordsPerCategory
        ).sort(() => Math.random() - 0.5)

        // Place remaining words in the remaining indices, randomly.
        for (let i = 0; i < numCategories; i++) {
            if (solvedCategories.some(cat => cat.categoryIndex === i)) continue

            for (let x = 0; x < wordsPerCategory; x++) {
                const indexInPuzzle = i * wordsPerCategory + x;
                const word = wordList[indexInPuzzle];
                word.indexInGrid = remainingIndices.pop() || -1;
            }
        }
        return wordList;
    }

    // Load game state from Firestore when component mounts or puzzle changes.
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

            const startingSolvedCategories: SolvedCategory[] = [];
            let startingMistakes = 0;
            const startingGuesses: number[] = [];

            // Reconstruct the game state from the saved guesses.
            if (gameState && gameState.guesses.length > 0) {
                startingGuesses.push(...gameState.guesses);
                gameState.guesses.forEach(guessNumber => {
                    // Check if this guess was correct
                    let wasCorrect = false;
                    for (let categoryIndex = 0; categoryIndex < currentPuzzle.categories.length; categoryIndex++) {
                        if (isGuessCorrect(guessNumber, categoryIndex)) {
                            startingSolvedCategories.push({categoryIndex});
                            wasCorrect = true;
                            break;
                        }
                    }

                    if (!wasCorrect) {
                        startingMistakes++;
                    }
                });
            }

            setSolvedCategories(startingSolvedCategories);
            setGuesses(startingGuesses);
            const mistakes = Math.max(0, 4 - startingMistakes);
            setMistakesRemaining(mistakes);
            setIsRevealing(false);
            setMessageText(null);
            setSelectedWords([]);

            const wordList: Word[] = currentPuzzle.words.map((word) => ({
                word,
                indexInGrid: -1
            }));
            setShuffledWords(shuffleWords(wordList, startingSolvedCategories, currentPuzzle.categories.length, 4));

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

                // Rearrange shuffledWords to put category words at the top
                // TODO

                // After animation completes, add to solved categories with fade
                setTimeout(() => {
                    if (!currentPuzzle) return;

                    setSolvedCategories(prevSolved => [...prevSolved, {
                        categoryIndex: index,
                        wasNotGuessed: true
                    }]);

                    // Remove these words from shuffled words
                    // TODO

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

    const handleWordClick = (word: Word) => {
        setSelectedWords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(word)) {
                newSet.delete(word);
            } else if (newSet.size < 4) {
                // Only allow selecting if less than 4 words are selected
                newSet.add(word);
            }
            return Array.from(newSet);
        });
    };

    const handleShuffle = () => {
        const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
        setShuffledWords(shuffled);
    };

    const handleDeselectAll = () => {
        setSelectedWords([]);
    };

    const processGuessIfCorrect = async (guess: Word[], updatedGuesses: number[]) => {
        if (!currentPuzzle) return false;

        for (let i = 0; i < currentPuzzle.categories.length; i++) {
            const categoryWords = currentPuzzle.words.slice(i * 4, (i + 1) * 4);
            const isMatch = categoryWords.every(word => selectedWords.some((obj) => obj.word === word)) &&
                guess.every(word => categoryWords.includes(word.word));
            if (isMatch) {
                await processCorrectGuess(i, updatedGuesses, categoryWords);
                return true
            }
        }
        return false;
    }

    // Shows a message for a set duration
    const showMessageWithTimeout = (text: string, duration: number = 2000) => {
        setMessageText(text);
        setTimeout(() => {
            setMessageText(null);
        }, duration);
    };

    // Triggers shake animation for the given words for a set duration
    const triggerShakeAnimation = (words: Word[], duration: number = 500) => {
        setShakingWords(words);
        setTimeout(() => {
            setShakingWords([]);
            setSelectedWords([]);
        }, duration);
    };

    // Saves the current game state to Firestore
    const saveCurrentGameState = async (updatedGuesses: number[]) => {
        if (!userId || !currentPuzzle?.id) return;
        await saveGameState({
            userId,
            puzzleId: currentPuzzle.id,
            guesses: updatedGuesses
        });
    };

    // Handles a correct guess: updates solved categories, removes words, and saves state
    const processCorrectGuess = async (categoryIndex: number, updatedGuesses: number[], categoryWords: string[]) => {
        const sortedWords = [...categoryWords].sort();
        setSolvedCategories(prev => [...prev, {
            name: currentPuzzle!.categories[categoryIndex],
            words: sortedWords,
            categoryIndex
        }]);
        setSelectedWords([]);
        setShuffledWords(prev => prev.filter(word => !categoryWords.includes(word.word)));
        await saveCurrentGameState(updatedGuesses);
    };

    // Handles an incorrect guess: triggers shake, updates mistakes, and saves state
    const processIncorrectGuess = async (updatedGuesses: number[]) => {
        triggerShakeAnimation(selectedWords);
        setMistakesRemaining(prev => prev - 1);
        await saveCurrentGameState(updatedGuesses);
    };

    const handleSubmit = async () => {
        if (selectedWords.length !== 4 || !userId || !currentPuzzle?.id) return;

        const selectedWordsArray = Array.from(selectedWords);
        const guessNumber = guessToNumber(selectedWordsArray);
        const isDuplicate = isDuplicateGuess(guessNumber, guesses);
        const isOneAwayGuess = isOneAway(guessNumber, currentPuzzle);

        // Save game state immediately (for all guesses)
        const updatedGuesses = [...guesses, guessNumber];
        setGuesses(updatedGuesses);

        // Check for correct guess
        if (await processGuessIfCorrect(selectedWordsArray, updatedGuesses)) {
            return;
        }

        // If we've gotten here, the guess was wrong.
        triggerShakeAnimation(selectedWords);

        if (isDuplicate) {
            if (isOneAwayGuess) {
                showMessageWithTimeout('Already guessed (One away)!');
            } else {
                showMessageWithTimeout('Already guessed!');
            }
            return;
        }

        if (isOneAwayGuess) {
            showMessageWithTimeout('One away!');
            await processIncorrectGuess(updatedGuesses);
            return;
        }
    }

    const categoryWords = (categoryIndex: number): string[] => {
        if (!currentPuzzle) return [];
        return currentPuzzle.words.slice(categoryIndex * 4, (categoryIndex + 1) * 4);
    }

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
                {messageText && (
                    <div className={styles.messageOverlay}>
                        <div className={styles.message}>
                            {messageText}
                        </div>
                    </div>
                )}
                {/* Show solved categories at the top */}
                {solvedCategories.map((category, index) => (
                    <div
                        key={index}
                        className={`${styles.solvedCategoryRow} ${category.wasNotGuessed ? styles.missedCategory : ''}`}
                        data-category-index={category.categoryIndex}
                    >
                        <div className={styles.categoryName}>{currentPuzzle.categories[category.categoryIndex]}</div>
                        <div className={styles.categoryWords}>
                            {categoryWords(category.categoryIndex).join(', ')}
                        </div>
                    </div>
                ))}

                {/* Show remaining words */}
                {shuffledWords.map((word, index) => (
                    <button
                        key={index}
                        className={`${styles.wordButton} ${selectedWords.includes(word) ? styles.selectedWord : ''} ${shakingWords.includes(word) ? styles.shakeWord : ''}`}
                        onClick={() => handleWordClick(word)}
                        disabled={isGameLost}
                    >
                        {word.word}
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
                        disabled={selectedWords.length === 0}
                    >
                        Deselect all
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={handleSubmit}
                        disabled={selectedWords.length !== 4}
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
};

export default Play;

