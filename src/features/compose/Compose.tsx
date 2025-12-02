import React, {useState, useMemo, useRef, useEffect} from "react";
import styles from "./style.module.css";
import {Puzzle} from '../../firebase/firestore';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {selectUser} from '../auth/slice';
import {createPuzzleThunk, updatePuzzleThunk, selectPuzzle} from './slice';
import {useAutosizeTextarea} from "./useAutosizeTextarea";
import ComposeHeader from './ComposeHeader';
import {classes} from "../../common/classUtils";
import {useNavigate} from "react-router-dom";

function isPuzzleStarted(puzzle: Puzzle) {
    return puzzle.categories.some(cat => cat.trim() !== "") ||
        puzzle.words.some(word => word.trim() !== "");
}

function isPuzzleChanged(puzzle: Puzzle, initial?: Puzzle) {
    if (!initial) return true;
    for (let i = 0; i < 4; i++) {
        if (puzzle.categories[i] !== initial.categories[i]) return true;
        for (let j = 0; j < 4; j++) {
            if (puzzle.words[i * 4 + j] !== initial.words[i * 4 + j]) return true;
        }
    }
    return false;
}

const Compose = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(selectUser);
    const initialPuzzle = useAppSelector(selectPuzzle);
    const composeError = useAppSelector(state => state.compose.error);

    // Default puzzle for creation
    const emptyPuzzle: Puzzle = {
        categories: Array(4).fill("") as string[],
        words: Array(16).fill("") as string[],
        creatorId: user?.uid || '<none>',
        createdAt: undefined,
        id: undefined,
        creatorName: '',
        creatorEmail: '',
    }

    const initialState = initialPuzzle || emptyPuzzle;
    const [puzzle, setPuzzle] = useState<Puzzle>(initialState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showSaveError, setShowSaveError] = useState(false);
    const [savedPuzzle, setSavedPuzzle] = useState<Puzzle | undefined>(initialPuzzle);

    // Update puzzle state when initialPuzzle changes
    React.useEffect(() => {
        setPuzzle(initialPuzzle || emptyPuzzle);
        setSavedPuzzle(initialPuzzle);
    }, [initialPuzzle]);

    // Memoize to avoid unnecessary recalculation
    const canSave = useMemo(() => {
        if (!isPuzzleStarted(puzzle)) return false;
        return !(savedPuzzle && !isPuzzleChanged(puzzle, savedPuzzle));
    }, [puzzle, savedPuzzle]);

    const handleCategoryNameChange = (catIdx: number, value: string) => {
        setPuzzle(prev => {
            const categories = prev.categories.map((cat, i) =>
                i === catIdx ? value : cat
            );
            return {...prev, categories};
        });
    };

    const handleWordChange = (catIdx: number, wordIdx: number, value: string) => {
        setPuzzle(prev => {
            const words = prev.words.map((w, idx) => {
                const targetIdx = catIdx * 4 + wordIdx;
                return idx === targetIdx ? value : w;
            });
            return {...prev, words};
        });
        setTimeout(() => syncRowHeights(catIdx), 0);
    };

    const saveOrCreate = async () => {
        if (user) {
            if (puzzle.id) {
                await dispatch(updatePuzzleThunk(puzzle));
            } else {
                // Remove id before creating
                const {id, ...puzzleWithoutId} = puzzle;
                await dispatch(createPuzzleThunk(puzzleWithoutId));
            }
        }
    }

    const handleSave = async () => {
        if (canSave) {
            setShowSaveSuccess(false);
            setShowSaveError(false);
            await saveOrCreate();
            if (!composeError) {
                setSavedPuzzle({...puzzle});
                setShowSaveSuccess(true);
                setTimeout(() => {
                    setShowSaveSuccess(false);
                }, 3000);
            } else {
                setShowSaveError(true);
                setTimeout(() => {
                    setShowSaveError(false);
                }, 3000);
            }
        }
    };

    // No-op handleBack for now
    const handleBack = async () => {
        if (canSave) {
            setShowSaveSuccess(false);
            setShowSaveError(false);
            await saveOrCreate();
            if (composeError) {
                setShowSaveError(true);
                setTimeout(() => {
                    setShowSaveError(false);
                }, 3000);
            } else {
                navigate("/")
            }
        } else {
            navigate("/")
        }
    };

    // Refs for word textareas: 4 rows x 4 cols
    const wordRefs = useRef<(HTMLTextAreaElement | null)[][]>(
        Array.from({ length: 4 }, () => Array(4).fill(null))
    );

    // Create a 2D array of autosize refs for word textareas (hooks must be called at top level)
    const wordAutosizeRefs: React.MutableRefObject<HTMLTextAreaElement | null>[][] = [];
    for (let catIdx = 0; catIdx < 4; catIdx++) {
        wordAutosizeRefs[catIdx] = [];
        for (let wordIdx = 0; wordIdx < 4; wordIdx++) {
            wordAutosizeRefs[catIdx][wordIdx] = useAutosizeTextarea(puzzle.words[catIdx * 4 + wordIdx]);
        }
    }

    // Helper to assign both the autosize ref and the tracking ref
    const getWordTextareaRef = (catIdx: number, wordIdx: number) => (el: HTMLTextAreaElement | null) => {
        wordRefs.current[catIdx][wordIdx] = el;
        wordAutosizeRefs[catIdx][wordIdx].current = el;
    };

    // Helper to sync heights for a row
    const syncRowHeights = (catIdx: number) => {
        const rowRefs = wordRefs.current[catIdx];
        // First, reset all heights so scrollHeight is accurate for shrinking
        rowRefs.forEach(ref => {
            if (ref) {
                ref.style.height = '';
            }
        });
        // Get max scrollHeight among all textareas in the row
        const heights = rowRefs.map(ref => ref ? ref.scrollHeight : 0);
        const maxHeight = Math.max(...heights);
        rowRefs.forEach(ref => {
            if (ref) {
                ref.style.height = maxHeight + 'px';
            }
        });
    };

    // On every puzzle.words change, sync all rows
    useEffect(() => {
        for (let catIdx = 0; catIdx < 4; catIdx++) {
            syncRowHeights(catIdx);
        }
    }, [puzzle.words]);

    return (
        <>
            <ComposeHeader handleBack={handleBack}/>
            <div className={styles.composeContainer}>
                {puzzle.categories.map((cat, catIdx) => (
                    <div className={styles.categoryBlock} key={catIdx}>
                        <textarea
                            ref={useAutosizeTextarea(cat)}
                            value={cat}
                            placeholder={`Category ${catIdx + 1}`}
                            onChange={e => handleCategoryNameChange(catIdx, e.target.value)}
                            className={classes(
                                styles.categoryTextarea,
                                styles[`categoryInput${catIdx + 1}`]
                            )}
                            rows={1}
                            style={{resize: "none"}}
                        />
                        <div className={styles.wordInputsRow}>
                            {[0, 1, 2, 3].map(wordIdx => (
                                <textarea
                                    key={wordIdx}
                                    ref={getWordTextareaRef(catIdx, wordIdx)}
                                    value={puzzle.words[catIdx * 4 + wordIdx]}
                                    placeholder={`Word ${wordIdx + 1}`}
                                    onChange={e => handleWordChange(catIdx, wordIdx, e.target.value)}
                                    className={classes(
                                        styles.wordTextarea,
                                        styles[`wordInput${catIdx + 1}`]
                                    )}
                                    rows={1}
                                    style={{resize: "none"}}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                <button
                    className={styles.actionButton}
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    Save
                </button>
                {composeError && showSaveError && (
                    <span className={styles.saveErrorMessage}>
                        {composeError}
                    </span>
                )}
                {showSaveSuccess && !composeError && (
                    <span className={styles.saveSuccessMessage}>
                        Saved successfully!
                    </span>
                )}
            </div>
        </>
    );
};

export default Compose;
