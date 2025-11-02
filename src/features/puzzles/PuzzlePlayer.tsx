import React, { useState, useEffect } from 'react';
import styles from './style.module.css';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectSelectedPuzzle } from './slice';
import { navigateToList } from '../app/slice';
import { selectUser } from '../auth/slice';

const PuzzlePlayer = () => {
    const dispatch = useAppDispatch();
    const selectedPuzzle = useAppSelector(selectSelectedPuzzle);
    const currentUser = useAppSelector(selectUser);
    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);

    useEffect(() => {
        // Shuffle the words when the component mounts or puzzle changes
        if (selectedPuzzle && selectedPuzzle.words) {
            const shuffled = [...selectedPuzzle.words].sort(() => Math.random() - 0.5);
            setShuffledWords(shuffled);
            setSelectedWords(new Set());
        }
    }, [selectedPuzzle]);

    const handleWordClick = (word: string) => {
        setSelectedWords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(word)) {
                newSet.delete(word);
            } else if (newSet.size < 4) {
                // Only allow selecting if less than 4 words are selected
                newSet.add(word);
            }
            return newSet;
        });
    };

    const handleShuffle = () => {
        const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
        setShuffledWords(shuffled);
    };

    const handleDeselectAll = () => {
        setSelectedWords(new Set());
    };

    const handleSubmit = () => {
        // For now, just deselect all words
        setSelectedWords(new Set());
    };

    const handleBack = () => {
        dispatch(navigateToList());
    };

    if (!selectedPuzzle) {
        return (
            <div className={styles.puzzlePlayerContainer}>
                <p>No puzzle selected</p>
                <button onClick={handleBack}>Back to List</button>
            </div>
        );
    }

    // Format creator name and date
    const creatorName = currentUser?.displayName || currentUser?.email || 'Unknown';
    const createdDate = selectedPuzzle.createdAt
        ? new Date(selectedPuzzle.createdAt.toDate()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Unknown date';

    return (
        <div className={styles.puzzlePlayerContainer}>
            <div className={styles.puzzlePlayerHeader}>
                <button className={styles.backButton} onClick={handleBack}>
                    ← Back to List
                </button>
                <h2>{creatorName}</h2>
                <p className={styles.createdDate}>{createdDate}</p>
            </div>

            <div className={styles.wordGrid}>
                {shuffledWords.map((word, index) => (
                    <button
                        key={index}
                        className={`${styles.wordButton} ${selectedWords.has(word) ? styles.selectedWord : ''}`}
                        onClick={() => handleWordClick(word)}
                    >
                        {word}
                    </button>
                ))}
            </div>

            <div className={styles.actionButtons}>
                <button className={styles.actionButton} onClick={handleShuffle}>
                    Shuffle
                </button>
                <button
                    className={styles.actionButton}
                    onClick={handleDeselectAll}
                    disabled={selectedWords.size === 0}
                >
                    Deselect all
                </button>
                <button
                    className={styles.actionButton}
                    onClick={handleSubmit}
                    disabled={selectedWords.size !== 4}
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default PuzzlePlayer;

