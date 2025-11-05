import React from 'react';
import styles from './style.module.css';
import { useAppSelector } from '../../common/hooks';
import { selectUser } from '../auth/slice';

const PlayList = () => {
    const user = useAppSelector(selectUser);

    // TODO: Fetch game states from Firestore for this user
    const gameStates: any[] = []; // Placeholder for now

    return (
        <div className={styles.playListContainer}>
            {gameStates.length === 0 ? (
                <div className={styles.emptyMessage}>
                    You have no puzzles you are playing yet.
                </div>
            ) : (
                <div className={styles.gameStateList}>
                    {/* TODO: Render game state items */}
                </div>
            )}
        </div>
    );
};

export default PlayList;

