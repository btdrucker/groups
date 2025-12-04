import React, {useEffect, useState, useRef, useLayoutEffect} from 'react';
import { useParams } from 'react-router-dom';
import styles from './style.module.css';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {selectGameStateWithPuzzleById, ensureGameStateLoaded, selectPlayLoading, selectPlayError} from './slice';
import {selectUserId} from '../auth/slice';
import {getGameState, PUZZLE_NOT_FOUND, saveGameState} from '../../firebase/firestore';
import {classes} from "../../common/classUtils";
import {Puzzle} from '../../firebase/firestore';
import {sleep} from '../../common/utils';
import PlayHeader from './PlayHeader';

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
        const wordIndex = updatedWords.findIndex(word => word.indexInGrid === targetGridIndex);
        if (wordIndex < 0) {
            console.warn('Word at target grid index not found:', targetGridIndex, updatedWords);
            continue; // Skip this swap
        }
        // Swap the indexInGrid values
        const categoryWordIndex = categoryIndex * wordsPerCategory + x;
        const tempIndex = updatedWords[categoryWordIndex].indexInGrid;
        updatedWords[categoryWordIndex].indexInGrid = updatedWords[wordIndex].indexInGrid;
        updatedWords[wordIndex].indexInGrid = tempIndex;
    }

    return updatedWords;
}

const shuffleWordsFromGridRow = (words: Word[], startRow: number, wordsPerCategory: number): Word[] => {
    const updatedWords = deepCopyWords(words);

    const indicesOfWordsToShuffle: number[] = [];
    const gridIndicesOfWordsToShuffle: number[] = [];
    for (let i = 0; i < words.length; i++) {
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

const calculateGridWidth = (window: Window | undefined): number => {
    // Subtract 32 to match 1rem of puzzlePlayerContainer horizontal padding.
    return Math.max(400, Math.min((window?.innerWidth || 675) - 32, 675));
}

const Play = () => {
    const dispatch = useAppDispatch();
    const userId = useAppSelector(selectUserId);
    const { puzzleId } = useParams();
    const currentPuzzleId = puzzleId;
    const gameStateWithPuzzle = useAppSelector(state => currentPuzzleId ? selectGameStateWithPuzzleById(state, currentPuzzleId) : undefined);
    const currentPuzzle = gameStateWithPuzzle?.puzzle;
    const loading = useAppSelector(selectPlayLoading);
    const error = useAppSelector(selectPlayError);

    const [guesses, setGuesses] = useState<number[]>([]); // Track guesses as 16-bit numbers from gameState
    const [selectedWords, setSelectedWords] = useState<Word[]>([]);
    const [gridWords, setGridWords] = useState<Word[]>([]);
    const [displayedCategories, setDisplayedCategories] = useState<DisplayedCategory[]>([]);
    const [mistakesRemaining, setMistakesRemaining] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const [messageText, setMessageText] = useState<string | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isLoadingGameState, setIsLoadingGameState] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [gridWidth, setGridWidth] = useState<number>(() => calculateGridWidth(window));

    useEffect(() => {
        const handleResize = () => setGridWidth(calculateGridWidth(window));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- FLIP animation setup ---
    const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const prevPositions = useRef<Map<number, DOMRect>>(new Map());
    const shouldAnimate = useRef(false);

    const measureCellPositions = () => {
        const positions = new Map<number, DOMRect>();
        gridWords.forEach(word => {
            const ref = cellRefs.current[word.indexInPuzzle];
            if (ref) {
                positions.set(word.indexInPuzzle, ref.getBoundingClientRect());
            }
        });
        return positions;
    };

    useLayoutEffect(() => {
        if (!shouldAnimate.current) {
            prevPositions.current = measureCellPositions();
            return;
        }
        // Animate moved cells
        const newPositions = measureCellPositions();
        prevPositions.current.forEach((prevRect, index) => {
            const newRect = newPositions.get(index);
            if (newRect) {
                const dx = prevRect.left - newRect.left;
                const dy = prevRect.top - newRect.top;
                if (dx !== 0 || dy !== 0) {
                    const ref = cellRefs.current[index];
                    if (ref) {
                        ref.style.transition = 'none';
                        ref.style.transform = `translate(${dx}px, ${dy}px)`;
                        requestAnimationFrame(() => {
                            ref.style.transition = 'transform 600ms cubic-bezier(0.25, 0.1, 0.25, 1)';
                            ref.style.transform = '';
                        });
                    }
                }
            }
        });
        shouldAnimate.current = false;
        prevPositions.current = newPositions;
    }, [gridWords]);

    useEffect(() => {
        if (!currentPuzzle || !userId) return; // Guard: only run when puzzle is loaded
        if (!gameStateWithPuzzle && typeof currentPuzzleId === 'string') {
            dispatch(ensureGameStateLoaded(currentPuzzleId));
        }
    }, [currentPuzzleId, userId, gameStateWithPuzzle, dispatch]);

    // Load game state from Firestore when component mounts or puzzle changes.
    useEffect(() => {
        const loadGameState = async () => {
            if (!currentPuzzle || !currentPuzzle.id || !userId) return;

            setIsLoadingGameState(true);
            const {gameState, error} = await getGameState(userId, currentPuzzle.id);

            if (error) {
                console.error('Error loading game state:', error);
                setIsLoadingGameState(false);
                return;
            }

            // If no game state exists, create a new one with empty guesses
            if (!gameState) {
                await saveGameState({
                    userId,
                    puzzleId: currentPuzzle.id,
                    guesses: []
                });
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
        if (!currentPuzzle || !gridWords.length) return; // Guard: only run reveal when puzzle and grid are ready
        if (mistakesRemaining === 0 && !isRevealing) {
            setIsRevealing(true);

            const numCategories = getNumCategories(currentPuzzle);
            const wordsPerCategory = getWordsPerCategory(currentPuzzle);

            // Start revealing unsolved categories one by one
            const revealNextCategory = (gridWords: Word[], categoryIndex: number, row: number) => {
                if (categoryIndex >= numCategories) {
                    return;
                }

                // Check if this category is already solved
                const isSolved = displayedCategories.some(cat => cat.categoryIndex === categoryIndex);
                if (isSolved) {
                    revealNextCategory(gridWords, categoryIndex + 1, row + 1);
                    return;
                }

                // Rearrange shuffledWords to put category words at the top
                prevPositions.current = measureCellPositions();
                shouldAnimate.current = true;

                const newGridWords = moveCategoryWordsToGridRow(gridWords, categoryIndex, row, wordsPerCategory);
                setGridWords(newGridWords);

                // After animation completes, add to solved categories with fade
                setTimeout(() => {
                    setDisplayedCategories(prevSolved => [...prevSolved, {
                        categoryIndex: categoryIndex,
                        wasGuessed: false
                    }]);

                    // Reveal next category
                    if (categoryIndex + 1 < numCategories) {
                        setTimeout(() => revealNextCategory(newGridWords, categoryIndex + 1, row + 1), 800);
                    }
                }, 800);
            };

            // Start the reveal sequence after a short delay
            setTimeout(() => revealNextCategory(gridWords, 0, 0), 500);
        }
    }, [mistakesRemaining, currentPuzzle, displayedCategories, isRevealing, gridWords]);

    let statusMessage: string | null = null;
    if (loading) {
        statusMessage = 'Loading...';
    } else if (error === PUZZLE_NOT_FOUND || !currentPuzzle) {
        statusMessage = "I can't find that puzzle!";
    } else if (error) {
        statusMessage = error;
    }

    if (statusMessage) {
        return (
            <>
                <PlayHeader/>
                <div className={styles.screenContainer}>
                    <p>{statusMessage}</p>
                </div>
            </>
        );
    }

    if (!currentPuzzle) {
        // This is just for type safety, should never happen due to above
        return null;
    }

    // At this point, currentPuzzle is guaranteed to exist
    const numCategories = getNumCategories(currentPuzzle);
    const wordsPerCategory = getWordsPerCategory(currentPuzzle);
    const availableMistakes = getAvailableMistakes(currentPuzzle);

    const handleWordClick = (word: Word) => {
        setSelectedWords(prev => toggleWordSelection(word, prev, wordsPerCategory));
    };

    const handleShuffle = async () => {
        // Step 1: Measure cell positions before gridWords update
        prevPositions.current = measureCellPositions();
        shouldAnimate.current = true;
        setIsShuffling(true);
        // Step 2: Shuffle words in grid
        setGridWords(prev => shuffleWordsFromGridRow(prev, displayedCategories.length, wordsPerCategory));
        // Step 3: Wait for animation duration (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsShuffling(false);
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
                await processCorrectGuess(i, updatedGuesses);
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
    const triggerShakeAnimation = async (duration: number = 750): Promise<void> => {
        setIsShaking(true);
        await sleep(duration);
        setIsShaking(false);
        setSelectedWords([]);
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
    const processCorrectGuess = async (categoryIndex: number, updatedGuesses: number[]) => {
        // Step 1: Measure cell positions before gridWords update
        prevPositions.current = measureCellPositions();
        shouldAnimate.current = true;
        // Step 2: Move words to target row (triggers FLIP animation)
        setGridWords(moveCategoryWordsToGridRow(gridWords, categoryIndex, displayedCategories.length, wordsPerCategory));
        // Step 3: Wait for animation duration (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        // Step 4: Wait for pause before reveal (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        // Step 5: Reveal category
        setDisplayedCategories(prev => [...prev, {categoryIndex, wasGuessed: true}]);
        setSelectedWords([]); // Clear selection after reveal
        await saveCurrentGameState(updatedGuesses);
    };

    // Handles an incorrect guess: triggers shake, updates mistakes, and saves state
    const processIncorrectGuess = async (updatedGuesses: number[], isOneAwayGuess: boolean) => {
        setMistakesRemaining(prev => prev - 1);
        await triggerShakeAnimation();
        if (isOneAwayGuess) {
            showMessageWithTimeout('One away!');
        }
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

        if (isDuplicate) {
            await triggerShakeAnimation();
            if (isOneAwayGuess) {
                showMessageWithTimeout('Already guessed (One away)!');
            } else {
                showMessageWithTimeout('Already guessed!');
            }
            return;
        }

        await processIncorrectGuess(updatedGuesses, isOneAwayGuess);
    }


    // Format creator name and date
    const creatorName = currentPuzzle.creatorName || 'Unknown creator';
    const createdDate = currentPuzzle.createdAt
        ? new Date(currentPuzzle.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown date';

    const isGameLost = mistakesRemaining === 0;
    const isComplete = displayedCategories.length === numCategories && !isGameLost;

    // Calculate cell width (4 columns, 3 gaps of 0.75rem)
    const gapPx = 0.5 * 32; // Assuming 1rem = 16px
    const totalGap = (wordsPerCategory - 1) * gapPx;
    const cellSize = (gridWidth - totalGap) / wordsPerCategory;

    if (loading || !currentPuzzle || !gridWords.length) {
        return (
            <>
                <PlayHeader/>
                <div className={styles.screenContainer}>
                    <p>Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <PlayHeader/>
            <div className={styles.screenContainer}>
                <p className={styles.createdDate}>
                    By {creatorName} ({createdDate})
                </p>

                <div
                    className={styles.wordGrid}
                    style={{
                        gridTemplateColumns: `repeat(${wordsPerCategory}, 1fr)`
                    }}
                >
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
                            className={classes(styles.categoryRow, !category.wasGuessed && styles.missedCategory)}
                            data-category-index={category.categoryIndex}
                            style={{
                                gridColumn: 0,
                                gridRow: index + 1
                            }}
                        >
                            <div
                                className={styles.categoryName}>{currentPuzzle.categories[category.categoryIndex]}</div>
                            <div className={styles.categoryWords}>
                                {categoryWords(category.categoryIndex).join(', ')}
                            </div>
                        </div>
                    ))}

                    {/* Show remaining words in grid */}
                    {gridWords.filter(word => {
                        // Exclude words in guessed categories
                        const categoryIdx = Math.floor(word.indexInPuzzle / wordsPerCategory);
                        return !displayedCategories.some(cat => cat.categoryIndex === categoryIdx);
                    }).map(word => (
                        <button
                            key={word.indexInPuzzle}
                            ref={el => {
                                cellRefs.current[word.indexInPuzzle] = el;
                            }}
                            className={classes(
                                styles.wordButton,
                                selectedWords.some(sel => sel.indexInPuzzle === word.indexInPuzzle) && styles.selectedWord,
                                isShaking && selectedWords.some(sel => sel.indexInPuzzle === word.indexInPuzzle) && styles.shakeWord
                            )}
                            style={{
                                gridColumn: (word.indexInGrid % wordsPerCategory) + 1,
                                gridRow: Math.floor(word.indexInGrid / wordsPerCategory) + 1,
                                width: cellSize,
                                minWidth: cellSize,
                                maxWidth: cellSize,
                                height: cellSize,
                                maxHeight: 80
                            }}
                            onClick={() => handleWordClick(word)}
                        >
                            {word.word}
                        </button>
                    ))}
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
                        You solved the puzzle!
                    </div>
                ) : isGameLost ? (
                    <div className={styles.gameOver}>
                        Better luck next time!
                    </div>
                ) : (
                    <div className={styles.buttonRow}>
                        <button className={styles.actionButton} onClick={handleShuffle} disabled={isShuffling}>
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
        </>
    );
};

export default Play;

