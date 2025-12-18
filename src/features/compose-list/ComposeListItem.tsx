import React, {useState} from 'react';
import {Puzzle} from '../../firebase/firestore';
import styles from './style.module.css';
import commonStyles from '../../common/style.module.css';
import {useNavigate} from 'react-router-dom';
import {isPuzzleComplete} from './slice';
import IconButton from '../../common/IconButton';
import {supportsShare} from "../../common/utils";

interface Props {
    puzzle: Puzzle;
}

const ComposeListItem = ({puzzle}: Props) => {
    const navigate = useNavigate();
    const isComplete = isPuzzleComplete(puzzle);
    const [messageText, setMessageText] = useState<string | null>(null);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger card click if clicking a button
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return;
        }
        if (puzzle.id) {
            navigate(`/compose/${puzzle.id}`);
        }
    };

    const handleShareClick = async () => {
        if (!puzzle.id) return;

        const shareUrl = `${window.location.origin}/play/${puzzle.id}`;

        if (supportsShare) {
            try {
                await navigator.share({
                    title: 'Play my puzzle!',
                    text: 'Check out this puzzle I created:',
                    url: shareUrl
                });
            } catch (err) {
                // User cancelled share or error occurred
                console.error('Share failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setMessageText('Link copied!');
                setTimeout(() => setMessageText(null), 2000);
            } catch (err) {
                console.error('Copy failed:', err);
            }
        }
    };

    return (
        <div
            className={styles.puzzleCard}
            onClick={handleCardClick}
        >
            {/* Overlay message if active */}
            {messageText && (
                <div className={commonStyles.messageOverlay}>
                    <div className={commonStyles.message}>
                        {messageText}
                    </div>
                </div>
            )}

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
            <div onClick={(e) => e.stopPropagation()} style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                {isComplete && (
                    <IconButton
                        onClick={handleShareClick}
                        icon={supportsShare ? "fa-share-from-square" : "fa-copy"}
                    >
                        {supportsShare ? 'Share' : 'Copy share link'}
                    </IconButton>
                )}
                <IconButton
                    onClick={() => navigate(`/stats/${puzzle.id}`)}
                    icon="fa-chart-simple"
                    style={{marginLeft: 'auto'}}
                >
                    Stats
                </IconButton>
            </div>
        </div>
    );
};

export default ComposeListItem;
