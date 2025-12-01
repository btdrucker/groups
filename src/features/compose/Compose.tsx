import React, {useState, useMemo} from "react";
import styles from "./style.module.css";
import {Puzzle} from '../../firebase/firestore';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {selectUser} from '../auth/slice';
import {createPuzzleThunk, updatePuzzleThunk, selectPuzzle} from './slice';
import {useAutosizeTextarea} from "./useAutosizeTextarea";
import ComposeHeader from './ComposeHeader';
import {classes} from "../../common/classUtils";

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

    return (
        <>
            <ComposeHeader/>
            <div className={styles.screenContainer}>
                <table className={styles.gridTable}>
                    <thead>
                    <tr>
                        <th>Category</th>
                        <th>Word 1</th>
                        <th>Word 2</th>
                        <th>Word 3</th>
                        <th>Word 4</th>
                    </tr>
                    </thead>
                    <tbody>
                    {puzzle.categories.map((cat, catIdx) => (
                        <tr key={catIdx}>
                            <td key={catIdx}>
                                <textarea
                                    ref={useAutosizeTextarea(cat)}
                                    value={cat}
                                    placeholder={`Category ${catIdx + 1}`}
                                    onChange={e => handleCategoryNameChange(catIdx, e.target.value)}
                                    className={classes(styles.categoryInput, styles.textareaWrap)}
                                    rows={1}
                                    style={{resize: "none"}}
                                />
                            </td>
                            {[0, 1, 2, 3].map(wordIdx => (
                                <td key={wordIdx}>
                                    <textarea key={wordIdx}
                                        ref={useAutosizeTextarea(puzzle.words[catIdx * 4 + wordIdx])}
                                        value={puzzle.words[catIdx * 4 + wordIdx]}
                                        placeholder={`Word ${wordIdx + 1}`}
                                        onChange={e => handleWordChange(catIdx, wordIdx, e.target.value)}
                                        className={classes(styles.wordInput, styles.textareaWrap)}
                                        rows={1}
                                        style={{resize: "none"}}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
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
