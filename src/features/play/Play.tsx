import React, {useEffect, useState, useRef, useLayoutEffect} from 'react';
import {useParams} from 'react-router-dom';
import styles from './style.module.css';
import {GameState, Puzzle, PUZZLE_NOT_FOUND} from '../../firebase/firestore';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {classes} from "../../common/utils";
import {sleep} from '../../common/utils';
import {selectUserId} from '../auth/slice';
import {
    selectPlayListLoading,
    selectPlayListError,
    selectGameStateByPuzzleId,
    selectPuzzleById,
    saveAndUpdateGameState,
    loadGameStateWithPuzzle,
} from '../play-list/slice';
import PlayHeader from './PlayHeader';

interface DisplayedGroup {
    groupIndex: number;
    wasGuessed?: boolean;
}

interface Word {
    word: string;
    indexInPuzzle: number;
    indexInGrid: number;
}

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

// Returns the number of correct words in a specified group for a given guess.
const numCorrectWordsForGroup = (guessNumber: number, groupIndex: number, wordsInGroup: number): number => {
    const groupMask = ((1 << wordsInGroup) - 1) << (groupIndex * wordsInGroup);
    const guessMasked = guessNumber & groupMask;
    return countSetBits(guessMasked);
}

// Checks if a guess matches a specified group.
const isGuessCorrect = (guessNumber: number, groupIndex: number, wordsPerGroup: number): boolean => {
    return numCorrectWordsForGroup(guessNumber, groupIndex, wordsPerGroup) === wordsPerGroup;
};

// Checks if a guess has all but one correct words in any group.
function isOneAway(guessNumber: number, numGroups: number, wordsPerGroup: number): boolean {
    for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        if (numCorrectWordsForGroup(guessNumber, groupIndex, wordsPerGroup) === (wordsPerGroup - 1)) {
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

const moveGroupWordsToGridRow = (words: Word[], groupIndex: number, targetRow: number, wordsPerGroup: number): Word[] => {
    const updatedWords = deepCopyWords(words);

    // Swap indexInGrid of group words to target row words.
    for (let x = 0; x < wordsPerGroup; x++) {
        // Find the word currently at targetGridIndex
        const targetGridIndex = targetRow * wordsPerGroup + x;
        const wordIndex = updatedWords.findIndex(word => word.indexInGrid === targetGridIndex);
        if (wordIndex < 0) {
            console.warn('Word at target grid index not found:', targetGridIndex, updatedWords);
            continue; // Skip this swap
        }
        // Swap the indexInGrid values
        const groupWordIndex = groupIndex * wordsPerGroup + x;
        const tempIndex = updatedWords[groupWordIndex].indexInGrid;
        updatedWords[groupWordIndex].indexInGrid = updatedWords[wordIndex].indexInGrid;
        updatedWords[wordIndex].indexInGrid = tempIndex;
    }

    return updatedWords;
}

const shuffleWordsFromGridRow = (words: Word[], startRow: number, wordsPerGroup: number): Word[] => {
    const updatedWords = deepCopyWords(words);

    const indicesOfWordsToShuffle: number[] = [];
    const gridIndicesOfWordsToShuffle: number[] = [];
    for (let i = 0; i < words.length; i++) {
        if (updatedWords[i].indexInGrid >= startRow * wordsPerGroup) {
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

const toggleWordSelection = (word: Word, prev: Word[], wordsPerGroup: number): Word[] => {
    const exists = prev.some(w => w.indexInPuzzle === word.indexInPuzzle);
    if (exists) {
        return prev.filter(w => w.indexInPuzzle !== word.indexInPuzzle);
    } else if (prev.length < wordsPerGroup) {
        return [...prev, word];
    }
    return prev;
}

const calculateGridWidth = (window: Window | undefined): number => {
    // Subtract 32 to match 1rem of puzzlePlayerContainer horizontal padding.
    return Math.max(400, Math.min((window?.innerWidth || 675) - 32, 675));
}

const Play = () => {
    const dispatch = useAppDispatch();
    const userId = useAppSelector(selectUserId);
    const {puzzleId} = useParams();
    const gameState: GameState | null = useAppSelector(state => selectGameStateByPuzzleId(state, puzzleId));
    const puzzle: Puzzle | null = useAppSelector(state => selectPuzzleById(state, puzzleId));
    const loading = useAppSelector(selectPlayListLoading);
    const error = useAppSelector(selectPlayListError);

    const [selectedWords, setSelectedWords] = useState<Word[]>([]);
    const [gridWords, setGridWords] = useState<Word[]>([]);
    const [displayedGroups, setDisplayedGroups] = useState<DisplayedGroup[]>([]);
    const [isShaking, setIsShaking] = useState(false);
    const [messageText, setMessageText] = useState<string | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [gridWidth, setGridWidth] = useState<number>(() => calculateGridWidth(window));

    // Derive guesses and mistakes from Redux state
    const guesses = gameState?.guesses || [];
    const mistakesRemaining = puzzle && gameState ? (() => {
        const numGroups = puzzle.numGroups;
        const wordsPerGroup = puzzle.wordsPerGroup;
        const availableMistakes = puzzle.numGroups;
        const mistakeCount = guesses.filter((guessNumber: number) => {
            // Count incorrect guesses (guesses that don't match any group)
            for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
                if (isGuessCorrect(guessNumber, groupIndex, wordsPerGroup)) {
                    return false; // This was a correct guess
                }
            }
            return true; // This was an incorrect guess
        }).length;
        return Math.max(0, availableMistakes - mistakeCount);
    })() : 0;

    useEffect(() => {
        const handleResize = () => setGridWidth(calculateGridWidth(window));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- FLIP animation setup ---
    const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const prevPositions = useRef<Map<number, DOMRect>>(new Map());
    const shouldAnimate = useRef(false);
    const initializedPuzzleId = useRef<string | null>(null);

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
        if (!userId || !puzzleId) return;

        // Dispatch if we don't have gameState OR if we have it but puzzle is null (from cache)
        if (!gameState || !puzzle) {
            dispatch(loadGameStateWithPuzzle({ userId, puzzleId }));
        }
    }, [puzzleId, userId, gameState, puzzle, dispatch]);

    // Load game state from Redux when component mounts or puzzle changes.
    useEffect(() => {
        if (!puzzle || !gameState) return;

        // Only initialize if this is a new puzzle (not just a guess update)
        const puzzleId = puzzle.id || null;
        if (initializedPuzzleId.current === puzzleId) return;
        initializedPuzzleId.current = puzzleId;

        const startingDisplayedGroups: DisplayedGroup[] = [];
        let startingMistakes = 0;

        let words: Word[] = puzzle.words.map((word: string, indexInPuzzle: number) => ({
            word,
            indexInPuzzle,
            indexInGrid: indexInPuzzle
        }));

        const numGroups = puzzle.numGroups;
        const wordsPerGroup = puzzle.wordsPerGroup;

        // Reconstruct the game state from the saved guesses.
        if (gameState.guesses.length > 0) {
            gameState.guesses.forEach((guessNumber: number) => {
                // Check if this guess was correct
                let wasCorrect = false;
                for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
                    if (isGuessCorrect(guessNumber, groupIndex, wordsPerGroup)) {
                        startingDisplayedGroups.push({groupIndex, wasGuessed: true});
                        wasCorrect = true;
                        words = moveGroupWordsToGridRow(words, groupIndex, startingDisplayedGroups.length - 1, wordsPerGroup);
                        break;
                    }
                }

                if (!wasCorrect) {
                    startingMistakes++;
                }
            });
        }

        const startingMistakesRemaining = Math.max(0, wordsPerGroup - startingMistakes);
        setIsRevealing(false);
        setMessageText(null);
        setSelectedWords([]);

        if (startingMistakesRemaining === 0) {
            for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
                if (startingDisplayedGroups.every(group => group.groupIndex !== groupIndex)) {
                    startingDisplayedGroups.push({groupIndex, wasGuessed: false});
                }
            }
        }
        setDisplayedGroups(startingDisplayedGroups);

        words = shuffleWordsFromGridRow(words, startingDisplayedGroups.length, wordsPerGroup)
        setGridWords(words);
    }, [puzzleId, puzzle]);

    // Trigger reveal animation when game is lost
    useEffect(() => {
        if (!puzzle || !gridWords.length) return; // Guard: only run reveal when puzzle and grid are ready
        if (mistakesRemaining === 0 && !isRevealing) {
            setIsRevealing(true);

            const numGroups = puzzle.numGroups;
            const wordsPerGroup = puzzle.wordsPerGroup;

            // Start revealing unsolved groups one by one
            const revealNextGroup = (gridWords: Word[], groupIndex: number, row: number) => {
                if (groupIndex >= numGroups) {
                    return;
                }

                // Check if this group is already solved
                const isSolved = displayedGroups.some(group => group.groupIndex === groupIndex);
                if (isSolved) {
                    revealNextGroup(gridWords, groupIndex + 1, row + 1);
                    return;
                }

                // Rearrange shuffledWords to put group words at the top
                prevPositions.current = measureCellPositions();
                shouldAnimate.current = true;

                const newGridWords = moveGroupWordsToGridRow(gridWords, groupIndex, row, wordsPerGroup);
                setGridWords(newGridWords);

                // After animation completes, add to solved groups with fade
                setTimeout(() => {
                    setDisplayedGroups(prevSolved => [...prevSolved, {
                        groupIndex: groupIndex,
                        wasGuessed: false
                    }]);

                    // Reveal next group
                    if (groupIndex + 1 < numGroups) {
                        setTimeout(() => revealNextGroup(newGridWords, groupIndex + 1, row + 1), 800);
                    }
                }, 800);
            };

            // Start the reveal sequence after a short delay
            setTimeout(() => revealNextGroup(gridWords, 0, 0), 500);
        }
    }, [mistakesRemaining, puzzle, displayedGroups, isRevealing, gridWords]);

    let statusMessage: string | null = null;
    if (loading) {
        statusMessage = 'Loading...';
    } else if (error === PUZZLE_NOT_FOUND || !puzzle) {
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

    if (!puzzle) {
        // This is just for type safety, should never happen due to above
        return null;
    }

    // At this point, puzzle is guaranteed to exist
    // Create a non-null constant for use in closures where TypeScript loses track of the type guard
    const numGroups = puzzle.numGroups;
    const wordsPerGroup = puzzle.wordsPerGroup;
    const availableMistakes = puzzle.numGroups;

    const handleWordClick = (word: Word) => {
        setSelectedWords(prev => toggleWordSelection(word, prev, wordsPerGroup));
    };

    const handleShuffle = async () => {
        // Step 1: Measure cell positions before gridWords update
        prevPositions.current = measureCellPositions();
        shouldAnimate.current = true;
        setIsShuffling(true);
        // Step 2: Shuffle words in grid
        setGridWords(prev => shuffleWordsFromGridRow(prev, displayedGroups.length, wordsPerGroup));
        // Step 3: Wait for animation duration (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsShuffling(false);
    };

    const handleDeselectAll = () => {
        setSelectedWords([]);
    };

    const groupWords = (groupIndex: number): string[] => {
        return puzzle.words.slice(groupIndex * wordsPerGroup, (groupIndex + 1) * wordsPerGroup);
    }

    const processGuessIfCorrect = async (guess: Word[], updatedGuesses: number[]) => {

        for (let i = 0; i < numGroups; i++) {
            const groupWordsArray = puzzle.words.slice(i * wordsPerGroup, (i + 1) * wordsPerGroup);
            const isMatch = groupWordsArray.every((word: string) => selectedWords.some((obj) => obj.word === word)) &&
                guess.every((word: Word) => groupWordsArray.includes(word.word));
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

    // Save the current game state to Firestore and update Redux
    const saveCurrentGameState = async (updatedGuesses: number[]) => {
        if (!userId || !puzzle.id) return;
        const updatedGameState: GameState = {
            ...gameState,
            userId,
            puzzleId: puzzle.id,
            guesses: updatedGuesses,
            // Denormalize puzzle metadata for efficient list display
            creatorName: puzzle.creatorName,
            createdAt: puzzle.createdAt ?? Date.now(),
            numGroups: puzzle.numGroups,
            wordsPerGroup: puzzle.wordsPerGroup,
        };
        await dispatch(saveAndUpdateGameState({ gameState: updatedGameState }));
    };

    // Handles a correct guess: updates solved groups, removes words, and saves state
    const processCorrectGuess = async (groupIndex: number, updatedGuesses: number[]) => {
        // Step 1: Measure cell positions before gridWords update
        prevPositions.current = measureCellPositions();
        shouldAnimate.current = true;
        // Step 2: Move words to target row (triggers FLIP animation)
        setGridWords(moveGroupWordsToGridRow(gridWords, groupIndex, displayedGroups.length, wordsPerGroup));
        // Step 3: Wait for animation duration (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        // Step 4: Wait for pause before reveal (600ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        // Step 5: Reveal group
        setDisplayedGroups(prev => [...prev, {groupIndex, wasGuessed: true}]);
        setSelectedWords([]); // Clear selection after reveal
        await saveCurrentGameState(updatedGuesses);
    };

    // Handles an incorrect guess: triggers shake and saves state
    const processIncorrectGuess = async (updatedGuesses: number[], isOneAwayGuess: boolean) => {
        await triggerShakeAnimation();
        if (isOneAwayGuess) {
            showMessageWithTimeout('One away!');
        }
        await saveCurrentGameState(updatedGuesses);
    };

    const handleSubmit = async () => {
        if (selectedWords.length !== wordsPerGroup || !userId) return;

        const selectedWordsArray = Array.from(selectedWords);
        const guessNumber = guessToNumber(selectedWordsArray);
        const isDuplicate = isDuplicateGuess(guessNumber, guesses);
        const isOneAwayGuess = isOneAway(guessNumber, numGroups, wordsPerGroup);

        // Check for duplicate BEFORE adding to guesses array
        if (isDuplicate) {
            await triggerShakeAnimation();
            if (isOneAwayGuess) {
                showMessageWithTimeout('Already guessed (One away)!');
            } else {
                showMessageWithTimeout('Already guessed!');
            }
            return;
        }

        // Add to guesses array (after duplicate check)
        const updatedGuesses = [...guesses, guessNumber];

        // Check for correct guess
        if (await processGuessIfCorrect(selectedWordsArray, updatedGuesses)) {
            return;
        }

        await processIncorrectGuess(updatedGuesses, isOneAwayGuess);
    }


    // Format creator name and date
    const creatorName = puzzle.creatorName || 'Unknown creator';
    const createdDate = puzzle.createdAt
        ? new Date(puzzle.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown date';

    const isGameLost = mistakesRemaining === 0;
    const isComplete = displayedGroups.length === numGroups && !isGameLost;

    // Calculate cell width (`wordsPerGroup` columns, 3 gaps of 0.75rem)
    const gapPx = 0.5 * 32; // Assuming 1rem = 16px
    const totalGap = (wordsPerGroup - 1) * gapPx;
    const cellSize = (gridWidth - totalGap) / wordsPerGroup;

    if (loading || !puzzle || !gridWords.length) {
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
                        gridTemplateColumns: `repeat(${wordsPerGroup}, 1fr)`
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

                    {/* Show solved groups at the top */}
                    {displayedGroups.map((group, index) => (
                        <div
                            key={index}
                            className={classes(styles.groupRow, !group.wasGuessed && styles.missedGroup)}
                            data-group-index={group.groupIndex}
                            style={{
                                gridColumn: 0,
                                gridRow: index + 1
                            }}
                        >
                            <div
                                className={styles.groupName}>{puzzle.categories[group.groupIndex]}</div>
                            <div className={styles.groupWords}>
                                {groupWords(group.groupIndex).join(', ')}
                            </div>
                        </div>
                    ))}

                    {/* Show remaining words in grid */}
                    {gridWords.filter(word => {
                        // Exclude words in guessed groups
                        const groupIndex = Math.floor(word.indexInPuzzle / wordsPerGroup);
                        return !displayedGroups.some(group => group.groupIndex === groupIndex);
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
                                gridColumn: (word.indexInGrid % wordsPerGroup) + 1,
                                gridRow: Math.floor(word.indexInGrid / wordsPerGroup) + 1,
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
                            disabled={selectedWords.length !== wordsPerGroup}
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
