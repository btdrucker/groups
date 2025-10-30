import React, { useState, useMemo } from "react";
import styles from "./style.module.css";

interface PuzzleCategory {
    name: string;
    words: string[]; // length 4
}

export interface Puzzle {
    categories: PuzzleCategory[]; // length 4
}

interface Props {
    initialPuzzle?: Puzzle;
    onSave: (puzzle: Puzzle) => void;
    onBack?: () => void;
}

const emptyPuzzle: Puzzle = {
    categories: Array(4).fill(null).map(() => ({
        name: "",
        words: Array(4).fill("")
    }))
};

function isPuzzleComplete(puzzle: Puzzle) {
    return puzzle.categories.every(
        cat => cat.name.trim() !== "" && cat.words.every(word => word.trim() !== "")
    );
}

function isPuzzleChanged(puzzle: Puzzle, initial?: Puzzle) {
    if (!initial) return true;
    for (let i = 0; i < 4; i++) {
        if (puzzle.categories[i].name !== initial.categories[i].name) return true;
        for (let j = 0; j < 4; j++) {
            if (puzzle.categories[i].words[j] !== initial.categories[i].words[j]) return true;
        }
    }
    return false;
}

const Composer2 = ({ initialPuzzle, onSave, onBack }: Props) => {
    const [puzzle, setPuzzle] = useState<Puzzle>(initialPuzzle || emptyPuzzle);

    // Memoize to avoid unnecessary recalculation
    const canSave = useMemo(() => {
        if (!isPuzzleComplete(puzzle)) return false;
        return !(initialPuzzle && !isPuzzleChanged(puzzle, initialPuzzle));

    }, [puzzle, initialPuzzle]);

    const handleCategoryNameChange = (catIdx: number, value: string) => {
        setPuzzle(prev => {
            const categories = prev.categories.map((cat, i) =>
                i === catIdx ? { ...cat, name: value } : cat
            );
            return { ...prev, categories };
        });
    };

    const handleWordChange = (catIdx: number, wordIdx: number, value: string) => {
        setPuzzle(prev => {
            const categories = prev.categories.map((cat, i) => {
                if (i !== catIdx) return cat;
                const words = cat.words.map((w, j) => (j === wordIdx ? value : w));
                return { ...cat, words };
            });
            return { ...prev, categories };
        });
    };

    const handleSave = () => {
        if (canSave) onSave(puzzle);
    };

    return (
        <div className={styles.composerContainer}>
            {onBack && (
                <button className={styles.backButton} onClick={onBack}>
                    ← Back
                </button>
            )}
            <h2>{initialPuzzle ? "Edit Puzzle" : "Create New Puzzle"}</h2>
            <div className={styles.gridContainer}>
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
                                <td>
                                    <input
                                        type="text"
                                        value={cat.name}
                                        placeholder={`Category ${catIdx + 1}`}
                                        onChange={e => handleCategoryNameChange(catIdx, e.target.value)}
                                        className={styles.categoryInput}
                                    />
                                </td>
                                {cat.words.map((word, wordIdx) => (
                                    <td key={wordIdx}>
                                        <input
                                            type="text"
                                            value={word}
                                            placeholder={`Word ${wordIdx + 1}`}
                                            onChange={e => handleWordChange(catIdx, wordIdx, e.target.value)}
                                            className={styles.wordInput}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={!canSave}
            >
                Save
            </button>
        </div>
    );
};

export default Composer2;
