import React from 'react';
import {Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';

interface Props {
    puzzle: Puzzle;
    onSelectPuzzle: (puzzleId: string) => void;
}

const PuzzleListItem = ({puzzle, onSelectPuzzle}: Props) => {
    return (
        <div
            className={styles.puzzleCard}
            onClick={() => puzzle.id && onSelectPuzzle(puzzle.id)}
        >
            <div className={styles.puzzleDetails}>
                <p className={styles.categories}>{puzzle.categories.join(', ')}</p>
            </div>
            {puzzle.createdAt && (
                <p className={styles.createdDate}>
                    {new Date(puzzle.createdAt.toDate()).toLocaleDateString()}
                </p>
            )}
        </div>
    );
};

export default PuzzleListItem;
