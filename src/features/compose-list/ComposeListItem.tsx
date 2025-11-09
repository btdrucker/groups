import React, { useState } from 'react';
import {Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';
import {useAppDispatch} from "../../common/hooks";
import {composePuzzle} from "../compose/slice";
import { useNavigate } from 'react-router-dom';

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

const ComposeListItem = ({puzzle}: Props) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const isComplete = isPuzzleComplete(puzzle);
    const [showCopyMessage, setShowCopyMessage] = useState(false);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger card click if clicking a button
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        if (puzzle.id) {
            dispatch(composePuzzle(puzzle));
            navigate('/compose');
        }
    };

    const handleShareClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (puzzle.id) {
            const shareUrl = `${window.location.origin}/groups/play/${puzzle.id}`;
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
                    {puzzle.categories.map((cat, idx) => (
                        <li key={idx} className={styles.categoryItem}>{cat}</li>
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
