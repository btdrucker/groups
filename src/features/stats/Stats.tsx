import React, {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {StatsStatus} from '../../firebase/firestore';
import {useAppDispatch, useAppSelector} from '../../common/hooks';
import {
    loadStatsThunk,
    selectStats,
    selectStatsLoading,
    selectStatsError,
    selectStatsLastUpdated,
    clearCurrentStats
} from './slice';
import StatsHeader from './StatsHeader';
import styles from './style.module.css';
import commonStyles from '../../common/style.module.css';

const Stats = () => {
    const {puzzleId} = useParams<{puzzleId: string}>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const stats = useAppSelector(selectStats);
    const loading = useAppSelector(selectStatsLoading);
    const error = useAppSelector(selectStatsError);
    const lastUpdated = useAppSelector(selectStatsLastUpdated);

    const loadStats = (force = false) => {
        if (!puzzleId) return;
        dispatch(loadStatsThunk({ puzzleId, force }));
    };

    useEffect(() => {
        loadStats(); // Loads from cache if available
        return () => {
            dispatch(clearCurrentStats());
        };
    }, [puzzleId]);

    const handleBack = () => {
        navigate('/compose-list');
    };

    const handleRefresh = () => {
        loadStats(true); // Force refresh from server
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

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <>
            <StatsHeader onBack={handleBack} onRefresh={handleRefresh} />
            <div className={commonStyles.screenContainer}>
                {lastUpdated && (
                    <div className={styles.lastUpdated}>
                        Last updated: {formatDateTime(lastUpdated)}
                    </div>
                )}
                <table className={styles.statsTable}>
                    <thead>
                        <tr className={styles.statsHeader}>
                            <th className={styles.headerCell}>Player</th>
                            <th className={styles.headerCell}>Status</th>
                            <th className={styles.headerCell}>Date</th>
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
                                <td className={styles.date}>{formatDate(stat.lastUpdated)}</td>
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
