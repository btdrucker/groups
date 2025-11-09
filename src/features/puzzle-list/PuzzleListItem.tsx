import React from 'react';
import {Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';
import {useAppDispatch} from "../../common/hooks";
import {composePuzzle, playPuzzle} from "../app/slice";

interface Props {
    puzzle: Puzzle;
}

// Helper function to check if puzzle is complete
const isPuzzleComplete = (puzzle: Puzzle): boolean => {
    const hasAllCategories = puzzle.categories.length === 4 &&
        puzzle.categories.every(cat => cat && cat.trim() !== '');
    const hasAllWords = puzzle.words.length === 16 &&
        puzzle.words.every(word => word && word.trim() !== '');
    return hasAllCategories && hasAllWords;
};

const PuzzleListItem = ({puzzle}: Props) => {
    const dispatch = useAppDispatch();
    const isComplete = isPuzzleComplete(puzzle);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger card click if clicking a button
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        puzzle.id && dispatch(composePuzzle(puzzle));
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        puzzle.id && dispatch(playPuzzle(puzzle));
    };

    return (
        <div
            className={styles.puzzleCard}
            onClick={handleCardClick}
        >
            <div className={styles.puzzleDetails}>
                <p className={styles.categories}>{puzzle.categories.join(', ')}</p>
            </div>
            {puzzle.createdAt && (
                <p className={styles.createdDate}>
                    {new Date(puzzle.createdAt.toDate()).toLocaleDateString()}
                </p>
            )}
            {isComplete && (
                <button
                    className={styles.actionButton}
                    onClick={handlePlayClick}
                >
                    Play
                </button>
            )}
        </div>
    );
};

export default PuzzleListItem;
