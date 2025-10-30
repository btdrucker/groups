import React, {useEffect, useState} from 'react';
import {User} from 'firebase/auth';
import {getUserPuzzles, Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';
import PuzzleListItem from './PuzzleListItem';

interface Props {
    user: User;
    onCreateNew: () => void;
    onSelectPuzzle?: (puzzle: Puzzle) => void;
    reloadKey?: number;
    onRefresh?: () => void;
}

const PuzzleList = ({user, onCreateNew, onSelectPuzzle, reloadKey, onRefresh}: Props) => {
    const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const showList = !loading && !error;

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
    }, [user.uid, reloadKey]);

    return (
        <div className={styles.puzzleListContainer}>
            <div className={styles.puzzleListHeader}>
                <h2>My Puzzles</h2>
                {!loading && (
                    <div style={{marginTop: 12}}>
                        <button className={styles.createButton} onClick={onCreateNew}>
                            Create New Puzzle
                        </button>
                        <button className={styles.createButton} onClick={onRefresh} style={{marginLeft: 8}}>
                            Refresh
                        </button>
                    </div>
                )}
            </div>
            {loading && (<p>Loading puzzles...</p>)}
            {error && (<p className={styles.error}>Error loading puzzles: {error}</p>)}
            {showList && (
                puzzles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>You haven't created any puzzles yet.</p>
                        <p>Click "Create New Puzzle" to get started!</p>
                    </div>
                ) : (
                    <div className={styles.puzzleGrid}>
                        {puzzles.map((puzzle) => (
                            <PuzzleListItem
                                key={puzzle.id}
                                puzzle={puzzle}
                                onSelectPuzzle={() => onSelectPuzzle && onSelectPuzzle(puzzle)}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default PuzzleList;
