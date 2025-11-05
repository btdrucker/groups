import React from 'react';
import {Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';

interface Props {
    puzzle: Puzzle;
    onSelectPuzzle: (puzzleId: string) => void;
    onPlayPuzzle?: (puzzleId: string) => void;
}

// Helper function to check if puzzle is complete
const isPuzzleComplete = (puzzle: Puzzle): boolean => {
    const hasAllCategories = puzzle.categories.length === 4 &&
        puzzle.categories.every(cat => cat && cat.trim() !== '');
    const hasAllWords = puzzle.words.length === 16 &&
        puzzle.words.every(word => word && word.trim() !== '');
    return hasAllCategories && hasAllWords;
};

const PuzzleListItem = ({puzzle, onSelectPuzzle, onPlayPuzzle}: Props) => {
    const isComplete = isPuzzleComplete(puzzle);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger card click if clicking a button
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        puzzle.id && onSelectPuzzle(puzzle.id);
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        puzzle.id && onPlayPuzzle?.(puzzle.id);
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
            {isComplete && onPlayPuzzle && (
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
