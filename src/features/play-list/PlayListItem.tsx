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
        if (puzzle?.id) {
            navigate(`/play/${puzzle.id}`);
        }
    };

    if (!puzzle) {
        return null;
    }

    const totalCategories = puzzle.categories.length;
    const isWon = correctGuesses === totalCategories;
    const isLost = !isWon && mistakes === 4;
    const isInProgress = !isWon && !isLost;
    const creatorName = puzzle.creatorName ? puzzle.creatorName : 'Unknown creator';
    const createdDate = puzzle.createdAt ? new Date(puzzle.createdAt).toLocaleDateString() : '';

    return (
        <div
            className={styles.puzzleCard}
            onClick={handleCardClick}
        >
            <div className={styles.puzzleMeta}>
                {createdDate && (
                    <span className={styles.createdDate}>
                        By {creatorName} ({createdDate})
                    </span>
                )}
            </div>
            <div className={styles.progressInfo}>
                {isWon && (
                    <>
                        <p className={styles.statusWin}>
                            You won! ({mistakes} mistake{mistakes !== 1 ? 's' : ''})
                        </p>
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
                <button className={styles.actionButton}>
                    Continue Playing
                </button>
            )}
        </div>
    );
};

export default PlayListItem;
