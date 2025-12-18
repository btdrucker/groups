import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PuzzlePlayerStats, getPuzzlePlayerStats } from '../../firebase/firestore';
import { RootState } from '../../common/store';

interface StatsState {
    stats: PuzzlePlayerStats[];
    loading: boolean;
    error: string | null;
    lastUpdated: number | null; // Timestamp when stats were last fetched
}

const initialState: StatsState = {
    stats: [],
    loading: false,
    error: null,
    lastUpdated: null,
};

// Async thunk to load stats
export const loadStatsThunk = createAsyncThunk(
    'stats/loadStats',
    async (puzzleId: string, { rejectWithValue }) => {
        const { stats, error } = await getPuzzlePlayerStats(puzzleId);
        if (error) {
            return rejectWithValue(error);
        }
        return stats;
    }
);

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        clearStats: (state) => {
            state.stats = [];
            state.error = null;
            state.lastUpdated = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadStatsThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadStatsThunk.fulfilled, (state, action: PayloadAction<PuzzlePlayerStats[]>) => {
            state.loading = false;
            state.stats = action.payload;
            state.lastUpdated = Date.now(); // Set the current time when data is successfully loaded
        });
        builder.addCase(loadStatsThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string || 'Failed to load stats';
        });
    },
});

export const { clearStats } = statsSlice.actions;

// Selectors
export const selectStats = (state: RootState) => state.stats.stats;
export const selectStatsLoading = (state: RootState) => state.stats.loading;
export const selectStatsError = (state: RootState) => state.stats.error;
export const selectStatsLastUpdated = (state: RootState) => state.stats.lastUpdated;

export default statsSlice.reducer;
