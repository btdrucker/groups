import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {PuzzlePlayerStats, StatsStatus, getPuzzlePlayerStats} from '../../firebase/firestore';
import StatsHeader from './StatsHeader';
import styles from './style.module.css';
import commonStyles from '../../common/style.module.css';

const Stats = () => {
    const {puzzleId} = useParams<{puzzleId: string}>();
    const navigate = useNavigate();

    const [stats, setStats] = useState<PuzzlePlayerStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = async () => {
        if (!puzzleId) return;

        setLoading(true);
        setError(null);

        try {
            const {stats: playerStats, error: statsError} = await getPuzzlePlayerStats(puzzleId);
            if (statsError) {
                setError('Failed to load stats. Please try again.');
            } else {
                setStats(playerStats);
            }
        } catch (err: any) {
            console.error('Failed to load stats:', err);
            setError('Failed to load stats. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, [puzzleId]);

    const handleBack = () => {
        navigate('/compose-list');
    };

    const handleRefresh = () => {
        loadStats();
    };

    if (loading) {
        return (
            <>
                <StatsHeader onBack={handleBack} onRefresh={handleRefresh} />
                <div className={commonStyles.screenContainer}>
                    <p>Loading stats...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <StatsHeader onBack={handleBack} onRefresh={handleRefresh} />
                <div className={commonStyles.screenContainer}>
                    <p className={styles.error}>{error}</p>
                </div>
            </>
        );
    }

    if (stats.length === 0) {
        return (
            <>
                <StatsHeader onBack={handleBack} onRefresh={handleRefresh} />
                <div className={commonStyles.screenContainer}>
                    <p>No one has played this puzzle yet.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <StatsHeader onBack={handleBack} onRefresh={handleRefresh} />
            <div className={commonStyles.screenContainer}>
                <table className={styles.statsTable}>
                    <thead>
                        <tr className={styles.statsHeader}>
                            <th className={styles.headerCell}>Player</th>
                            <th className={styles.headerCell}>Status</th>
                            <th className={styles.headerCell}>Groups Solved</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((stat) => (
                            <tr key={stat.id} className={styles.statsRow}>
                                <td className={styles.playerName}>{stat.userName}</td>
                                <td className={styles.status}>
                                    {stat.status === StatsStatus.WON && <span className={styles.statusWon}>Won</span>}
                                    {stat.status === StatsStatus.LOST && <span className={styles.statusLost}>Lost</span>}
                                    {stat.status === StatsStatus.WIP && <span className={styles.statusWip}>WIP</span>}
                                </td>
                                <td className={styles.groupsSolved}>
                                    {stat.groupsSolved.length === 0 ? (
                                        <span className={styles.noGroups}>None</span>
                                    ) : (
                                        <div className={styles.groupBadges}>
                                            {stat.groupsSolved.map(groupIndex => (
                                                <span
                                                    key={groupIndex}
                                                    className={styles.groupBadge}
                                                    data-group-index={groupIndex}
                                                >
                                                    {groupIndex + 1}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default Stats;
