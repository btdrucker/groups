import React, { useState } from 'react';
import {Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';
import { useNavigate } from 'react-router-dom';
import { isPuzzleComplete } from './slice';

interface Props {
    puzzle: Puzzle;
}

const ComposeListItem = ({puzzle}: Props) => {
    const navigate = useNavigate();
    const isComplete = isPuzzleComplete(puzzle);
    const [showCopyMessage, setShowCopyMessage] = useState(false);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger card click if clicking a button
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        if (puzzle.id) {
            navigate(`/compose/${puzzle.id}`);
        }
    };

    const handleShareClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (puzzle.id) {
            const shareUrl = `${window.location.origin}/play/${puzzle.id}`;
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShowCopyMessage(true);
                setTimeout(() => setShowCopyMessage(false), 2000);
            } catch (err) {
                // Optionally handle error
            }
        }
    };

    return (
        <div
            className={styles.puzzleCard}
            onClick={handleCardClick}
        >
            {puzzle.createdAt && (
                <p className={styles.createdDate}>
                    {new Date(puzzle.createdAt).toLocaleDateString()}
                </p>
            )}
            <div className={styles.puzzleDetails}>
                <ul className={styles.categoriesList}>
                    {puzzle.categories.map((cat, index) => (
                        <li key={index} className={styles.categoryItem}>{cat}</li>
                    ))}
                </ul>
            </div>
            {isComplete && (
                <button
                    className={styles.actionButton}
                    onClick={handleShareClick}
                >
                    {showCopyMessage ? 'Link copied!' : 'Get share link'}
                </button>
            )}
        </div>
    );
};

export default ComposeListItem;
