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
import IconButton from "../../common/IconButton";

function isPuzzleStarted(puzzle: Puzzle) {
    return puzzle.categories.some(group => group.trim() !== "") ||
        puzzle.words.some(word => word.trim() !== "");
}

function isPuzzleChanged(puzzle: Puzzle, initial?: Puzzle) {
    if (!initial) return true;
    for (let i = 0; i < puzzle.numGroups; i++) {
        if (puzzle.categories[i] !== initial.categories[i]) return true;
        for (let j = 0; j < puzzle.wordsPerGroup; j++) {
            if (puzzle.words[i * puzzle.wordsPerGroup + j] !== initial.words[i * puzzle.wordsPerGroup + j]) return true;
        }
    }
    return false;
}

const Compose = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { puzzleId } = useParams<{ puzzleId?: string }>();
    const user = useAppSelector(selectUser);
    const puzzleFromRedux = useAppSelector(selectPuzzle);
    const composeError = useAppSelector(state => state.compose.error);

    // Default puzzle for creation
    const defaultNumGroups = 4;
    const defaultWordsPerGroup = 4;
    const emptyPuzzle: Puzzle = {
        categories: Array(defaultNumGroups).fill("") as string[],
        words: Array(defaultNumGroups * defaultWordsPerGroup).fill("") as string[],
        creatorId: user?.uid || '',
        createdAt: undefined,
        id: undefined,
        creatorName: user?.displayName || '',
        numGroups: defaultNumGroups,
        wordsPerGroup: defaultWordsPerGroup,
    };

    const initialState = puzzleFromRedux || emptyPuzzle;
    const [puzzle, setPuzzle] = useState<Puzzle>(initialState);
    const [messageText, setMessageText] = useState<string | null>(null);
    const [savedPuzzle, setSavedPuzzle] = useState<Puzzle | undefined>(puzzleFromRedux);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

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

    // Update puzzle state when Redux puzzle changes
    useEffect(() => {
        setPuzzle(puzzleFromRedux || emptyPuzzle);
        setSavedPuzzle(puzzleFromRedux);
    }, [puzzleFromRedux]);

    // Memoize to avoid unnecessary recalculation
    const canSave = useMemo(() => {
        if (!isPuzzleStarted(puzzle)) return false;
        return !(savedPuzzle && !isPuzzleChanged(puzzle, savedPuzzle));
    }, [puzzle, savedPuzzle]);

    const handleGroupNameChange = (groupIndex: number, value: string) => {
        setPuzzle(prev => {
            const categories = prev.categories.map((group, i) =>
                i === groupIndex ? value : group
            );
            return {...prev, categories};
        });
    };

    const handleWordChange = (groupIndex: number, wordIndex: number, value: string) => {
        setPuzzle(prev => {
            const words = prev.words.map((word, index) => {
                const targetIndex = groupIndex * prev.wordsPerGroup + wordIndex;
                return index === targetIndex ? value : word;
            });
            return {...prev, words};
        });
        setTimeout(() => syncRowHeights(groupIndex), 0);
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
        if (canSave && !saving) {
            setSaving(true);
            try {
                await saveOrCreate();
                if (!composeError) {
                    setSavedPuzzle({...puzzle});
                    showMessageWithTimeout('Saved successfully!', 3000);
                } else {
                    showMessageWithTimeout(composeError, 3000);
                }
            } finally {
                setSaving(false);
            }
        }
    };

    const handleBack = async () => {
        if (canSave) {
            await saveOrCreate();
            if (composeError) {
                showMessageWithTimeout(composeError, 3000);
            } else {
                navigate("/compose-list");
            }
        } else {
            navigate("/compose-list");
        }
    };

    const handleDelete = async () => {
        if (!puzzle || !puzzle.id) return; // Only delete if puzzle has an id
        setDeleting(true);
        await dispatch(deletePuzzleThunk(puzzle.id));
        setDeleting(false);
        navigate("/compose-list");
    };

    // Shows a message for a set duration
    const showMessageWithTimeout = (text: string, duration: number = 2000) => {
        setMessageText(text);
        setTimeout(() => {
            setMessageText(null);
        }, duration);
    };

    const supportsShare = typeof navigator !== 'undefined' && !!navigator.share;

    const isPuzzleComplete = useMemo(() => {
        return puzzle.categories.every(cat => cat && cat.trim() !== '') &&
            puzzle.words.every(word => word && word.trim() !== '');
    }, [puzzle.categories, puzzle.words]);

    const canShare = useMemo(() => {
        return !canSave && isPuzzleComplete && !!puzzle.id;
    }, [canSave, isPuzzleComplete, puzzle.id]);

    const handleShare = async () => {
        if (!puzzle.id) return;

        const shareUrl = `${window.location.origin}/play/${puzzle.id}`;

        if (supportsShare) {
            try {
                await navigator.share({
                    title: 'Play my puzzle!',
                    url: shareUrl
                });
            } catch (err) {
                // User cancelled share or error occurred
                console.error('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showMessageWithTimeout('Link copied!', 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        }
    };

    // Refs for word textareas: numGroups rows x wordsPerGroup cols
    const wordRefs = useRef<(HTMLTextAreaElement | null)[][]>(
        Array.from({ length: puzzle.numGroups }, () => Array(puzzle.wordsPerGroup).fill(null))
    );

    // Create autosize refs for group name textareas (dynamically based on numGroups)
    const groupAutosizeRefs: React.MutableRefObject<HTMLTextAreaElement | null>[] = [];
    for (let i = 0; i < puzzle.numGroups; i++) {
        groupAutosizeRefs.push(useAutosizeTextarea(puzzle.categories[i] || ''));
    }

    // Create a 2D array of autosize refs for word textareas (hooks must be called at top level)
    const wordAutosizeRefs: React.MutableRefObject<HTMLTextAreaElement | null>[][] = [];
    for (let groupIndex = 0; groupIndex < puzzle.numGroups; groupIndex++) {
        wordAutosizeRefs[groupIndex] = [];
        for (let wordIndex = 0; wordIndex < puzzle.wordsPerGroup; wordIndex++) {
            wordAutosizeRefs[groupIndex][wordIndex] = useAutosizeTextarea(puzzle.words[groupIndex * puzzle.wordsPerGroup + wordIndex] || '');
        }
    }

    // Helper to assign both the autosize ref and the tracking ref
    const getWordTextareaRef = (groupIndex: number, wordIndex: number) => (el: HTMLTextAreaElement | null) => {
        wordRefs.current[groupIndex][wordIndex] = el;
        wordAutosizeRefs[groupIndex][wordIndex].current = el;
    };

    // Helper to sync heights for a row
    const syncRowHeights = (groupIndex: number) => {
        const rowRefs = wordRefs.current[groupIndex];
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
        for (let groupIndex = 0; groupIndex < puzzle.numGroups; groupIndex++) {
            syncRowHeights(groupIndex);
        }
    }, [puzzle.words]);

    return (
        <>
            <ComposeHeader handleBack={handleBack}/>
            <div className={styles.composeContainer}>
                {puzzle.categories.map((group, groupIndex) => (
                    <div className={styles.groupBlock} key={groupIndex}>
                        <textarea
                            ref={groupAutosizeRefs[groupIndex]}
                            value={group}
                            placeholder={`Group ${groupIndex + 1}`}
                            onChange={e => handleGroupNameChange(groupIndex, e.target.value)}
                            className={classes(
                                styles.groupTextarea,
                                styles[`groupInput${groupIndex + 1}`]
                            )}
                            rows={1}
                            style={{resize: "none"}}
                        />
                        <div className={styles.wordInputsRow}>
                            {Array.from({ length: puzzle.wordsPerGroup }, (_, wordIndex) => (
                                <textarea
                                    key={wordIndex}
                                    ref={getWordTextareaRef(groupIndex, wordIndex)}
                                    value={puzzle.words[groupIndex * puzzle.wordsPerGroup + wordIndex]}
                                    placeholder={`Word ${wordIndex + 1}`}
                                    onChange={e => handleWordChange(groupIndex, wordIndex, e.target.value)}
                                    className={classes(
                                        styles.wordTextarea,
                                        styles[`wordInput${groupIndex + 1}`]
                                    )}
                                    rows={1}
                                    style={{resize: "none"}}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                {/* Overlay message if active */}
                {messageText && (
                    <div className={styles.messageOverlay}>
                        <div className={styles.message}>
                            {messageText}
                        </div>
                    </div>
                )}

                {/* Button row: Save left, Share middle, Delete right */}
                <div className={styles.buttonRow}>
                    <IconButton
                        onClick={handleSave}
                        icon="fa-floppy-disk"
                        disabled={!canSave || saving}
                        style={{float: 'left'}}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </IconButton>
                    <IconButton
                        onClick={handleShare}
                        icon={supportsShare ? "fa-share-from-square" : "fa-copy"}
                        disabled={!canShare}
                        style={{margin: '0 auto', display: 'block'}}
                    >
                        {supportsShare ? 'Share' : 'Copy share link'}
                    </IconButton>
                    <button
                        className={classes(styles.actionButton, styles.logout)}
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{float: 'right'}}
                        disabled={deleting}
                    >
                        <span className={styles.hideOnMobile}>Delete</span> <i className="fa-solid fa-trash-can"></i>
                    </button>
                </div>
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
