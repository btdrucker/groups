import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PuzzlePlayerStats, getPuzzlePlayerStats } from '../../firebase/firestore';
import { RootState } from '../../common/store';

interface PuzzleStatsCache {
    stats: PuzzlePlayerStats[];
    lastUpdated: number; // Timestamp when stats were last fetched
}

interface StatsState {
    statsCache: Record<string, PuzzleStatsCache>; // Keyed by puzzleId
    currentPuzzleId: string | null; // Currently viewed puzzle
    loading: boolean;
    error: string | null;
}

const initialState: StatsState = {
    statsCache: {},
    currentPuzzleId: null,
    loading: false,
    error: null,
};

// Async thunk to load stats with caching support
export const loadStatsThunk = createAsyncThunk(
    'stats/loadStats',
    async ({ puzzleId, force = false }: { puzzleId: string; force?: boolean }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;

        // Check if stats are already cached (unless force refresh)
        if (!force && state.stats.statsCache[puzzleId]) {
            // Return cached stats
            return { puzzleId, stats: state.stats.statsCache[puzzleId].stats, fromCache: true };
        }

        // Fetch from Firestore
        const { stats, error } = await getPuzzlePlayerStats(puzzleId);
        if (error) {
            return rejectWithValue(error);
        }
        return { puzzleId, stats, fromCache: false };
    }
);

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        setCurrentPuzzle: (state, action: PayloadAction<string | null>) => {
            state.currentPuzzleId = action.payload;
        },
        clearCurrentStats: (state) => {
            state.currentPuzzleId = null;
            state.error = null;
        },
        // Update a specific stat in the cache (useful when a player updates their game)
        updateStatInCache: (state, action: PayloadAction<{ puzzleId: string; stat: PuzzlePlayerStats }>) => {
            const { puzzleId, stat } = action.payload;
            if (state.statsCache[puzzleId]) {
                const index = state.statsCache[puzzleId].stats.findIndex(s => s.id === stat.id);
                if (index !== -1) {
                    state.statsCache[puzzleId].stats[index] = stat;
                } else {
                    state.statsCache[puzzleId].stats.push(stat);
                }
                state.statsCache[puzzleId].lastUpdated = Date.now();
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadStatsThunk.pending, (state, action) => {
            state.loading = true;
            state.error = null;
            state.currentPuzzleId = action.meta.arg.puzzleId;
        });
        builder.addCase(loadStatsThunk.fulfilled, (state, action) => {
            state.loading = false;
            const { puzzleId, stats, fromCache } = action.payload;

            // Update cache (even if from cache, to ensure state consistency)
            if (!fromCache) {
                state.statsCache[puzzleId] = {
                    stats,
                    lastUpdated: Date.now(),
                };
            }
            state.currentPuzzleId = puzzleId;
        });
        builder.addCase(loadStatsThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string || 'Failed to load stats';
        });
    },
});

export const { setCurrentPuzzle, clearCurrentStats, updateStatInCache } = statsSlice.actions;

// Selectors
export const selectStats = (state: RootState) => {
    const puzzleId = state.stats.currentPuzzleId;
    if (!puzzleId || !state.stats.statsCache[puzzleId]) {
        return [];
    }
    return state.stats.statsCache[puzzleId].stats;
};

export const selectStatsLoading = (state: RootState) => state.stats.loading;
export const selectStatsError = (state: RootState) => state.stats.error;

export const selectStatsLastUpdated = (state: RootState) => {
    const puzzleId = state.stats.currentPuzzleId;
    if (!puzzleId || !state.stats.statsCache[puzzleId]) {
        return null;
    }
    return state.stats.statsCache[puzzleId].lastUpdated;
};

export const selectCurrentPuzzleId = (state: RootState) => state.stats.currentPuzzleId;

// Check if stats are cached for a specific puzzle
export const selectHasCachedStats = (puzzleId: string) => (state: RootState) => {
    return !!state.stats.statsCache[puzzleId];
};

export default statsSlice.reducer;
