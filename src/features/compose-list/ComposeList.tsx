import React, {useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';
import ComposeListItem from './ComposeListItem';
import { useAppDispatch, useAppSelector } from '../../common/hooks';
import {
    fetchUserPuzzles,
    selectPuzzles,
    selectPuzzlesLoading,
    selectPuzzlesError,
} from './slice';
import { selectUser } from '../auth/slice';
import ComposeListHeader from './ComposeListHeader';
import commonStyles from '../../common/style.module.css';

const ComposeList = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(selectUser);
    const puzzles = useAppSelector(selectPuzzles);
    const loading = useAppSelector(selectPuzzlesLoading);
    const error = useAppSelector(selectPuzzlesError);
    const showList = !loading && !error;

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchUserPuzzles(user.uid));
        }
    }, [user?.uid, dispatch]);

    const handleCreateNew = () => {
        dispatch({ type: 'compose/composeNewPuzzle' });
        navigate('/compose');
    };

    const MakeNewPuzzleButton: React.FC = () => (
        <button className={`${commonStyles.actionButton} ${commonStyles.greenButton}`} onClick={handleCreateNew}>
            Make a new Puzzle
        </button>
    );

    return (
        <>
            <ComposeListHeader />
            <div className={styles.puzzleListContainer}>
                {loading && (<p>Loading puzzles...</p>)}
                {error && (<p className={styles.error}>Error loading puzzles: {error}</p>)}
                {showList && (
                    puzzles.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>You haven't created any puzzles yet.</p>
                            <MakeNewPuzzleButton />
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <MakeNewPuzzleButton />
                            </div>
                            <div className={styles.puzzleGrid}>
                                {puzzles.map((puzzle) => (
                                    <ComposeListItem
                                        key={puzzle.id}
                                        puzzle={puzzle}
                                    />
                                ))}
                            </div>
                        </>
                    )
                )}
            </div>
        </>
    );
};

export default ComposeList;
