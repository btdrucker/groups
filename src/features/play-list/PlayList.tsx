import React, { useEffect } from 'react';
import styles from './style.module.css';
import PlayListItem from './PlayListItem';
import { useAppDispatch, useAppSelector } from '../../common/hooks';
import { selectUser } from '../auth/slice';
import {
    fetchUserGameStates,
    selectGameStatesWithPuzzles,
    selectGameStatesLoading,
    selectGameStatesError,
} from './slice';
import PlayListHeader from './PlayListHeader';

const PlayList = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const gameStatesWithPuzzles = useAppSelector(selectGameStatesWithPuzzles);
    const loading = useAppSelector(selectGameStatesLoading);
    const error = useAppSelector(selectGameStatesError);
    const showList = !loading && !error;

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchUserGameStates(user.uid));
        }
    }, [user?.uid, dispatch]);

    return (
        <>
            <PlayListHeader />
            <div className={styles.playListContainer}>
                {loading && (<p>Loading puzzles...</p>)}
                {error && (<p className={styles.error}>Error loading puzzles: {error}</p>)}
                {showList && (
                    gameStatesWithPuzzles.length === 0 ? (
                        <div className={styles.emptyMessage}>
                            You have no puzzles you are playing yet.
                        </div>
                    ) : (
                        <div className={styles.puzzleGrid}>
                            {gameStatesWithPuzzles.map((gameStateWithPuzzle) => (
                                <PlayListItem
                                    key={gameStateWithPuzzle.gameState.id}
                                    gameStateWithPuzzle={gameStateWithPuzzle}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>
        </>
    );
};

export default PlayList;
