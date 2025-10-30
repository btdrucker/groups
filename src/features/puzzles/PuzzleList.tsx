import React, {useEffect} from 'react';
import styles from './style.module.css';
import PuzzleListItem from './PuzzleListItem';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
    fetchUserPuzzles,
    selectPuzzles,
    selectPuzzlesLoading,
    selectPuzzlesError,
    selectPuzzle,
    clearSelectedPuzzle
} from './slice';
import { selectUser } from '../auth/slice';
import { navigateToComposer } from '../app/slice';
import { Puzzle } from '../../firebase/firestore';

const PuzzleList = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const puzzles = useAppSelector(selectPuzzles);
    const loading = useAppSelector(selectPuzzlesLoading);
    const error = useAppSelector(selectPuzzlesError);
    const showList = !loading && !error;

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchUserPuzzles(user.uid));
        }
    }, [user?.uid, dispatch]);

    const handleCreateNew = () => {
        dispatch(clearSelectedPuzzle());
        dispatch(navigateToComposer());
    };

    const handleRefresh = () => {
        if (user?.uid) {
            dispatch(fetchUserPuzzles(user.uid));
        }
    };

    const handleSelectPuzzle = (puzzle: Puzzle) => {
        dispatch(selectPuzzle(puzzle));
        dispatch(navigateToComposer());
    };

    return (
        <div className={styles.puzzleListContainer}>
            <div className={styles.puzzleListHeader}>
                <h2>My Puzzles</h2>
                {!loading && (
                    <div style={{marginTop: 12}}>
                        <button className={styles.createButton} onClick={handleCreateNew}>
                            Create New Puzzle
                        </button>
                        <button className={styles.createButton} onClick={handleRefresh} style={{marginLeft: 8}}>
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
                                onSelectPuzzle={() => handleSelectPuzzle(puzzle)}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default PuzzleList;
