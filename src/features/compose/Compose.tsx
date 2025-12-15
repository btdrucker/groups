import React, {useState, useMemo, useRef, useEffect} from "react";
import styles from "./style.module.css";
import {Puzzle} from '../../firebase/firestore';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {selectUser} from '../auth/slice';
import {
    createPuzzleThunk,
    updatePuzzleThunk,
    deletePuzzleThunk,
    loadPuzzleById,
    selectPuzzle,
    clearPuzzle
} from './slice';
import {useAutosizeTextarea} from "./useAutosizeTextarea";
import ComposeHeader from './ComposeHeader';
import {classes} from "../../common/classUtils";
import {useNavigate, useParams} from "react-router-dom";

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
    const { puzzleId } = useParams<{ puzzleId?: string }>();
    const user = useAppSelector(selectUser);
    const initialPuzzle = useAppSelector(selectPuzzle);
    const composeError = useAppSelector(state => state.compose.error);

    // Default puzzle for creation
    const emptyPuzzle: Puzzle = {
        categories: Array(4).fill("") as string[],
        words: Array(16).fill("") as string[],
        creatorId: user?.uid || '',
        createdAt: undefined,
        id: undefined,
        creatorName: user?.displayName || '',
    }

    // Load puzzle if editing
    useEffect(() => {
        if (puzzleId) {
            dispatch(loadPuzzleById(puzzleId));
        } else {
            dispatch(clearPuzzle());
        }
        // Clear puzzle state on unmount
        return () => { dispatch(clearPuzzle()); };
    }, [dispatch, puzzleId]);

    // Use loaded puzzle or empty for new
    const initialState = initialPuzzle || emptyPuzzle;
    const [puzzle, setPuzzle] = useState<Puzzle>(initialState);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showSaveError, setShowSaveError] = useState(false);
    const [savedPuzzle, setSavedPuzzle] = useState<Puzzle | undefined>(initialPuzzle);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Update puzzle state when initialPuzzle changes
    useEffect(() => {
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
            const puzzleToSave = {
                ...puzzle,
                creatorName: user.displayName?.trim() || '',
                creatorId: user.uid || '<none>',
            };
            if (puzzle.id) {
                await dispatch(updatePuzzleThunk(puzzleToSave));
            } else {
                // Remove id before creating
                const {id, ...puzzleWithoutId} = puzzleToSave;
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
                navigate("/compose-list");
            }
        } else {
            navigate("/compose-list");
        }
    };

    const handleDelete = async () => {
        if (!puzzle.id) return; // Only delete if puzzle has an id
        setDeleting(true);
        await dispatch(deletePuzzleThunk(puzzle.id));
        setDeleting(false);
        navigate("/compose-list");
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
                {/* Button row: Save left, Delete right */}
                <div className={styles.buttonRow}>
                    <button
                        className={styles.actionButton}
                        onClick={handleSave}
                        disabled={!canSave}
                        style={{float: 'left'}}
                    >
                        Save
                    </button>
                    <button
                        className={classes(styles.actionButton, styles.logout)}
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{float: 'right'}}
                        disabled={deleting}
                    >
                        Delete
                    </button>
                </div>
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
                {showDeleteConfirm && (
                    <div className={styles.overlay}>
                        <div className={styles.confirmDialog}>
                            <p>Are you sure you want to delete this puzzle?</p>
                            <div className={styles.confirmButtons}>
                                <button
                                    className={styles.actionButton}
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={classes(styles.actionButton, styles.logout)}
                                    onClick={handleDelete}
                                    disabled={deleting || !puzzle.id}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Compose;
