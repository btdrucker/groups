import React, {useEffect} from 'react';
import styles from './style.module.css';
import ComposeListItem from './ComposeListItem';
import { useAppDispatch, useAppSelector } from '../../common/hooks';
import {
    fetchUserPuzzles,
    selectPuzzles,
    selectPuzzlesLoading,
    selectPuzzlesError,
} from './slice';
import { selectUser } from '../auth/slice';

const ComposeList = () => {
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

    return (
        <div className={styles.puzzleListContainer}>
            {loading && (<p>Loading puzzles...</p>)}
            {error && (<p className={styles.error}>Error loading puzzles: {error}</p>)}
            {showList && (
                puzzles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>You haven't created any puzzles yet.</p>
                        <p>Click "Make a new Puzzle" to get started!</p>
                    </div>
                ) : (
                    <div className={styles.puzzleGrid}>
                        {puzzles.map((puzzle) => (
                            <ComposeListItem
                                key={puzzle.id}
                                puzzle={puzzle}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default ComposeList;
