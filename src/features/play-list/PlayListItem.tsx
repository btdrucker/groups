import React from 'react';
import { GameStateWithPuzzle } from './slice';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';

interface Props {
    gameStateWithPuzzle: GameStateWithPuzzle;
}

const PlayListItem = ({ gameStateWithPuzzle }: Props) => {
    const navigate = useNavigate();
    const { puzzle, correctGuesses, mistakes } = gameStateWithPuzzle;

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger card click if clicking a button
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        if (puzzle?.id) {
            navigate(`/play/${puzzle.id}`);
        }
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (puzzle?.id) {
            navigate(`/play/${puzzle.id}`);
        }
    };

    if (!puzzle) {
        return null;
    }

    // Determine puzzle status
    const totalCategories = puzzle.categories.length;
    const isWon = correctGuesses === totalCategories;
    const isLost = !isWon && mistakes === 4;
    const isInProgress = !isWon && !isLost;

    return (
        <div
            className={styles.puzzleCard}
            onClick={handleCardClick}
        >
            {/* Puzzle creator and date at the top */}
            <div className={styles.puzzleMeta}>
                {puzzle.createdAt && (
                    <span className={styles.createdDate}>
                        {new Date(puzzle.createdAt).toLocaleDateString()}
                    </span>
                )}
            </div>
            <div className={styles.progressInfo}>
                {isWon && (
                    <>
                        <p className={styles.statusWin}>
                            You won! ({mistakes} mistake{mistakes !== 1 ? 's' : ''})
                        </p>
                        <ul className={styles.categoriesList}>
                            {puzzle.categories.map((cat, idx) => (
                                <li key={idx} className={styles.categoryItem}>{cat}</li>
                            ))}
                        </ul>
                    </>
                )}
                {isLost && (
                    <p className={styles.statusLose}>
                        You didn't win ({correctGuesses} group{correctGuesses !== 1 ? 's' : ''} guessed)
                    </p>
                )}
                {isInProgress && (
                    <p className={styles.statusInProgress}>
                        Keep going! ({correctGuesses} group{correctGuesses !== 1 ? 's' : ''} guessed, {mistakes} mistake{mistakes !== 1 ? 's' : ''})
                    </p>
                )}
            </div>
            {isInProgress && (
                <button
                    className={styles.actionButton}
                    onClick={handlePlayClick}
                >
                    Continue Playing
                </button>
            )}
        </div>
    );
};

export default PlayListItem;
