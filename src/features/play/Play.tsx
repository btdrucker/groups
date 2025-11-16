import React, {useEffect, useState} from 'react';
import styles from './style.module.css';
import {useAppSelector} from '../../common/hooks';
import {selectPuzzle, selectPlayLoading, selectPlayError} from './slice';
import {selectUserId} from '../auth/slice';
import {getGameState, saveGameState} from '../../firebase/firestore';
import {classes} from "../../common/classUtils";
import {Puzzle} from '../../firebase/firestore';

interface DisplayedCategory {
    categoryIndex: number;
    wasGuessed?: boolean;
}

interface Word {
    word: string;
    indexInPuzzle: number;
    indexInGrid: number;
}

// Calculate the number of categories in a puzzle
const getNumCategories = (puzzle: Puzzle): number => {
    return puzzle.categories.length;
};

// Calculate the number of words per category in a puzzle
const getWordsPerCategory = (puzzle: Puzzle): number => {
    return puzzle.words.length / puzzle.categories.length;
};

// Calculate the number of available mistakes (same as number of categories)
const getAvailableMistakes = (puzzle: Puzzle): number => {
    return puzzle.categories.length;
};

// Converts a guess (set of words) to a number where each bit represents whether a word was selected.
// The bit position is determined by the word's position in the puzzle's words array.
const guessToNumber = (guess: Word[]): number => {
    let result = 0;
    guess.forEach((word) => result |= (1 << word.indexInPuzzle));
    return result;
};

// Counts the number of set bits in a number.
const countSetBits = (n: number): number => {
    let count = 0;
    while (n) {
        if (n & 1) count++;
        n >>= 1;
    }
    return count;
}

// Returns the number of correct words in a specified category for a given guess.
const numCorrectWordsForCategory = (guessNumber: number, categoryIndex: number, wordsInCategory: number): number => {
    const categoryMask = ((1 << wordsInCategory) - 1) << (categoryIndex * wordsInCategory);
    const guessMasked = guessNumber & categoryMask;
    return countSetBits(guessMasked);
}

// Checks if a guess matches a specified category.
const isGuessCorrect = (guessNumber: number, categoryIndex: number, wordsPerCategory: number): boolean => {
    return numCorrectWordsForCategory(guessNumber, categoryIndex, wordsPerCategory) === wordsPerCategory;
};

// Checks if a guess has all but one correct words in any category.
function isOneAway(guessNumber: number, numCategories: number, wordsPerCategory: number): boolean {
    for (let categoryIndex = 0; categoryIndex < numCategories; categoryIndex++) {
        if (numCorrectWordsForCategory(guessNumber, categoryIndex, wordsPerCategory) === (wordsPerCategory - 1)) {
            return true;
        }
    }
    return false;
}

// Checks if a guess number already exists in guesses.
const isDuplicateGuess = (guessNumber: number, guesses: number[]): boolean => {
    return guesses.includes(guessNumber);
};

const deepCopyWords = (words: Word[]): Word[] => {
    return words.map(word => ({...word}));
}

const moveCategoryWordsToGridRow = (words: Word[], categoryIndex: number, targetRow: number, wordsPerCategory: number): Word[] => {
    const updatedWords = deepCopyWords(words);

    // Swap indexInGrid of category words to target row words.
    for (let x = 0; x < wordsPerCategory; x++) {
        // Find the word currently at targetGridIndex
        const targetGridIndex = targetRow * wordsPerCategory + x;
        const wordAtTargetIndex = updatedWords.find(word => word.indexInGrid === targetGridIndex);
        if (!wordAtTargetIndex) throw new Error('Target grid index word not found');

        // Swap the indexInGrid values
        const categoryWordIndex = categoryIndex * wordsPerCategory + x;
        const tempIndex = updatedWords[categoryWordIndex].indexInGrid;
        updatedWords[categoryWordIndex].indexInGrid = wordAtTargetIndex.indexInGrid;
        wordAtTargetIndex.indexInGrid = tempIndex;
    }

    return updatedWords;
}

const shuffleWordsFromGridRow = (words: Word[], startRow: number, wordsPerCategory: number): Word[] => {
    const updatedWords = deepCopyWords(words);

    const indicesOfWordsToShuffle: number[] = [];
    const gridIndicesOfWordsToShuffle: number[] = [];
    for (let i = 0; i < words.length - 1; i++) {
        if (updatedWords[i].indexInGrid >= startRow * wordsPerCategory) {
            indicesOfWordsToShuffle.push(i);
            gridIndicesOfWordsToShuffle.push(updatedWords[i].indexInGrid);
        }
    }
    // Shuffle the grid indices
    gridIndicesOfWordsToShuffle.sort(() => Math.random() - 0.5);
    // Reassign the shuffled grid indices back to the words
    indicesOfWordsToShuffle.forEach((wordIndex, i) => {
        updatedWords[wordIndex].indexInGrid = gridIndicesOfWordsToShuffle[i];
    });

    return updatedWords;
}

const toggleWordSelection = (word: Word, prev: Word[], wordsPerCategory: number): Word[] => {
    const newSet = new Set(prev);
    if (newSet.has(word)) {
        newSet.delete(word);
    } else if (newSet.size < wordsPerCategory) {
        newSet.add(word);
    }
    return Array.from(newSet);
}

const Play = () => {
    const currentPuzzle = useAppSelector(selectPuzzle);
    const isLoadingPuzzle = useAppSelector(selectPlayLoading);
    const puzzleError = useAppSelector(selectPlayError);
    const userId = useAppSelector(selectUserId);


    const [guesses, setGuesses] = useState<number[]>([]); // Track guesses as 16-bit numbers from gameState
    const [selectedWords, setSelectedWords] = useState<Word[]>([]);
    const [gridWords, setGridWords] = useState<Word[]>([]);
    const [displayedCategories, setDisplayedCategories] = useState<DisplayedCategory[]>([]);
    const [mistakesRemaining, setMistakesRemaining] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const [messageText, setMessageText] = useState<string | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isLoadingGameState, setIsLoadingGameState] = useState(false);
    const [loadError, setLoadError] = useState(false);

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

            const startingDisplayedCategories: DisplayedCategory[] = [];
            let startingMistakes = 0;
            const startingGuesses: number[] = [];

            let words: Word[] = currentPuzzle.words.map((word, indexInPuzzle) => ({
                word,
                indexInPuzzle,
                indexInGrid: indexInPuzzle
            }));

            const numCategories = getNumCategories(currentPuzzle);
            const wordsPerCategory = getWordsPerCategory(currentPuzzle);

            // Reconstruct the game state from the saved guesses.
            if (gameState && gameState.guesses.length > 0) {
                startingGuesses.push(...gameState.guesses);
                gameState.guesses.forEach(guessNumber => {
                    // Check if this guess was correct
                    let wasCorrect = false;
                    for (let categoryIndex = 0; categoryIndex < numCategories; categoryIndex++) {
                        if (isGuessCorrect(guessNumber, categoryIndex, wordsPerCategory)) {
                            startingDisplayedCategories.push({categoryIndex, wasGuessed: true});
                            wasCorrect = true;
                            words = moveCategoryWordsToGridRow(words, categoryIndex, startingDisplayedCategories.length - 1, wordsPerCategory);
                            break;
                        }
                    }

                    if (!wasCorrect) {
                        startingMistakes++;
                    }
                });
            }

            setGuesses(startingGuesses);
            const startingMistakesRemaining = Math.max(0, wordsPerCategory - startingMistakes);
            setMistakesRemaining(startingMistakesRemaining);
            setIsRevealing(false);
            setMessageText(null);
            setSelectedWords([]);

            if (startingMistakesRemaining === 0) {
                for (let categoryIndex = 0; categoryIndex < numCategories; categoryIndex++) {
                    if (startingDisplayedCategories.every(cat => cat.categoryIndex !== categoryIndex)) {
                        startingDisplayedCategories.push({categoryIndex, wasGuessed: false});
                    }
                }
            }
            setDisplayedCategories(startingDisplayedCategories);

            words = shuffleWordsFromGridRow(words, startingDisplayedCategories.length, wordsPerCategory)
            setGridWords(words);

            setIsLoadingGameState(false);
        };
        loadGameState();
    }, [currentPuzzle, userId]);

    // Trigger reveal animation when game is lost
    useEffect(() => {
        if (mistakesRemaining === 0 && !isRevealing && currentPuzzle) {
            setIsRevealing(true);

            const numCategories = getNumCategories(currentPuzzle);
            const wordsPerCategory = getWordsPerCategory(currentPuzzle);

            // Start revealing unsolved categories one by one
            const revealNextCategory = (categoryIndex: number) => {
                if (!currentPuzzle || categoryIndex >= numCategories) {
                    return;
                }

                // Check if this category is already solved
                const isSolved = displayedCategories.some(cat => cat.categoryIndex === categoryIndex);
                if (isSolved) {
                    // Skip to next category
                    setTimeout(() => revealNextCategory(categoryIndex + 1), 100);
                    return;
                }

                // Rearrange shuffledWords to put category words at the top
                setGridWords(moveCategoryWordsToGridRow(gridWords, categoryIndex, displayedCategories.length, wordsPerCategory));

                // After animation completes, add to solved categories with fade
                setTimeout(() => {
                    if (!currentPuzzle) return;

                    setDisplayedCategories(prevSolved => [...prevSolved, {
                        categoryIndex: categoryIndex,
                        wasGuessed: false
                    }]);

                    // Reveal next category
                    if (categoryIndex + 1 < numCategories) {
                        setTimeout(() => revealNextCategory(categoryIndex + 1), 800);
                    }
                }, 800);
            };

            // Start the reveal sequence after a short delay
            setTimeout(() => revealNextCategory(0), 500);
        }
    }, [mistakesRemaining, currentPuzzle, displayedCategories, isRevealing, gridWords]);

    // Conditional rendering for loading, error, not found
    if (isLoadingPuzzle || isLoadingGameState) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>Loading...</p>
            </div>
        );
    }

    if (puzzleError || loadError) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>There was an error loading the puzzle.</p>
            </div>
        );
    }

    if (!currentPuzzle) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>I can't find that puzzle!</p>
            </div>
        );
    }

    // At this point, currentPuzzle is guaranteed to exist
    const numCategories = getNumCategories(currentPuzzle);
    const wordsPerCategory = getWordsPerCategory(currentPuzzle);
    const availableMistakes = getAvailableMistakes(currentPuzzle);

    const handleWordClick = (word: Word) => {
        setSelectedWords(prev => toggleWordSelection(word, prev, wordsPerCategory));
    };

    const handleShuffle = () => {
        const shuffled = [...gridWords].sort(() => Math.random() - 0.5);
        setGridWords(shuffled);
    };

    const handleDeselectAll = () => {
        setSelectedWords([]);
    };

    const categoryWords = (categoryIndex: number): string[] => {
        return currentPuzzle.words.slice(categoryIndex * wordsPerCategory, (categoryIndex + 1) * wordsPerCategory);
    }

    const processGuessIfCorrect = async (guess: Word[], updatedGuesses: number[]) => {

        for (let i = 0; i < numCategories; i++) {
            const categoryWords = currentPuzzle.words.slice(i * wordsPerCategory, (i + 1) * wordsPerCategory);
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
        setIsShaking(true);
        setTimeout(() => {
            setIsShaking(false);
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
        setDisplayedCategories(prev => [...prev, {
            name: currentPuzzle.categories[categoryIndex],
            words: sortedWords,
            categoryIndex
        }]);
        setSelectedWords([]);
        setGridWords(prev => prev.filter(word => !categoryWords.includes(word.word)));
        await saveCurrentGameState(updatedGuesses);
    };

    // Handles an incorrect guess: triggers shake, updates mistakes, and saves state
    const processIncorrectGuess = async (updatedGuesses: number[]) => {
        triggerShakeAnimation(selectedWords);
        setMistakesRemaining(prev => prev - 1);
        await saveCurrentGameState(updatedGuesses);
    };

    const handleSubmit = async () => {
        if (selectedWords.length !== wordsPerCategory || !userId) return;

        const selectedWordsArray = Array.from(selectedWords);
        const guessNumber = guessToNumber(selectedWordsArray);
        const isDuplicate = isDuplicateGuess(guessNumber, guesses);
        const isOneAwayGuess = isOneAway(guessNumber, numCategories, wordsPerCategory);

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


    // Format creator name and date
    const createdDate = currentPuzzle.createdAt
        ? new Date(currentPuzzle.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown date';

    const isGameLost = mistakesRemaining === 0;
    const isComplete = displayedCategories.length === numCategories && !isGameLost;

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
                {displayedCategories.map((category, index) => (
                    <div
                        key={index}
                        className={classes(styles.solvedCategoryRow, !category.wasGuessed && styles.missedCategory)}
                        data-category-index={category.categoryIndex}
                    >
                        <div className={styles.categoryName}>{currentPuzzle.categories[category.categoryIndex]}</div>
                        <div className={styles.categoryWords}>
                            {categoryWords(category.categoryIndex).join(', ')}
                        </div>
                    </div>
                ))}

                {/* Show remaining words in grid rows */}
                {Array.from({length: numCategories - displayedCategories.length}).map((_, rowIdx) => {
                    const start = (displayedCategories.length + rowIdx) * wordsPerCategory;
                    const end = start + wordsPerCategory;
                    return (
                        <div className={styles.wordRow} key={rowIdx}>
                            {gridWords.slice(start, end).map((word, index) => (
                                <button
                                    key={index}
                                    className={classes(
                                        styles.wordButton,
                                        selectedWords.includes(word) && styles.selectedWord,
                                        isShaking && selectedWords.includes(word) && styles.shakeWord
                                    )}
                                    onClick={() => handleWordClick(word)}
                                    disabled={isGameLost}
                                >
                                    {word.word}
                                </button>
                            ))}
                        </div>
                    );
                })}
            </div>

            <div className={styles.mistakesContainer}>
                <span className={styles.mistakesLabel}>Mistakes remaining:</span>
                <div className={styles.mistakesDots}>
                    {Array.from({length: availableMistakes}).map((_, index) => (
                        <span
                            key={index}
                            className={classes(styles.mistakeDot, index < mistakesRemaining && styles.mistakeDotActive)}
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
                        disabled={selectedWords.length !== wordsPerCategory}
                    >
                        Submit
                    </button>
                </div>
            )}
        </div>
    );
};

export default Play;

