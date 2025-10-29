import React, {useEffect, useState} from 'react';
import {User} from 'firebase/auth';
import {getUserPuzzles, Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';

interface PuzzleListProps {
    user: User;
    onCreateNew: () => void;
    onSelectPuzzle?: (puzzleId: string) => void;
}

const PuzzleList: React.FC<PuzzleListProps> = ({user, onCreateNew, onSelectPuzzle}) => {
    const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPuzzles = async () => {
            setLoading(true);
            const {puzzles, error} = await getUserPuzzles(user.uid);

            if (error) {
                setError(error);
            } else {
                setPuzzles(puzzles);
            }

            setLoading(false);
        };

        fetchPuzzles();
    }, [user.uid]);

    if (loading) {
        return (
            <div className={styles.puzzleListContainer}>
                <h2>My Puzzles</h2>
                <p>Loading puzzles...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.puzzleListContainer}>
                <h2>My Puzzles</h2>
                <p className={styles.error}>Error loading puzzles: {error}</p>
                <button className={styles.createButton} onClick={onCreateNew}>
                    Create New Puzzle
                </button>
            </div>
        );
    }

    return (
        <div className={styles.puzzleListContainer}>
            <div className={styles.puzzleListHeader}>
                <h2>My Puzzles</h2>
                <button className={styles.createButton} onClick={onCreateNew}>
                    + Create New Puzzle
                </button>
            </div>

            {puzzles.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't created any puzzles yet.</p>
                    <p>Click "Create New Puzzle" to get started!</p>
                </div>
            ) : (
                <div className={styles.puzzleGrid}>
                    {puzzles.map((puzzle) => (
                        <div
                            key={puzzle.id}
                            className={styles.puzzleCard}
                            onClick={() => onSelectPuzzle && puzzle.id && onSelectPuzzle(puzzle.id)}
                        >
                            <h3>Puzzle</h3>
                            <div className={styles.puzzleDetails}>
                                <p className={styles.categoryCount}>{puzzle.categories.length} categories</p>
                                {puzzle.createdAt && (
                                    <p className={styles.createdDate}>
                                        {new Date(puzzle.createdAt.toDate()).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <p className={styles.wordCount}>
                                {puzzle.words.length} words
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PuzzleList;

