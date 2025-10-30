import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    Puzzle,
    getUserPuzzles,
    createPuzzle as createPuzzleFirestore,
    updatePuzzle as updatePuzzleFirestore
} from '../../firebase/firestore';
import { RootState } from '../../app/store';

interface PuzzlesState {
    puzzles: Puzzle[];
    loading: boolean;
    error: string | null;
    selectedPuzzle: Puzzle | undefined;
}

const initialState: PuzzlesState = {
    puzzles: [],
    loading: false,
    error: null,
    selectedPuzzle: undefined,
};

// Async thunks
export const fetchUserPuzzles = createAsyncThunk(
    'puzzles/fetchUserPuzzles',
    async (userId: string, { rejectWithValue }) => {
        const { puzzles, error } = await getUserPuzzles(userId);
        if (error) {
            return rejectWithValue(error);
        }
        return puzzles;
    }
);

export const createPuzzleThunk = createAsyncThunk(
    'puzzles/createPuzzle',
    async ({ puzzle, userId }: { puzzle: Puzzle; userId: string }, { rejectWithValue }) => {
        const { id, error } = await createPuzzleFirestore(puzzle, userId);
        if (error || !id) {
            return rejectWithValue(error || 'Failed to create puzzle');
        }
        return { ...puzzle, id, creatorId: userId };
    }
);

export const updatePuzzleThunk = createAsyncThunk(
    'puzzles/updatePuzzle',
    async (puzzle: Puzzle, { rejectWithValue }) => {
        const { error } = await updatePuzzleFirestore(puzzle);
        if (error) {
            return rejectWithValue(error);
        }
        return puzzle;
    }
);

const puzzlesSlice = createSlice({
    name: 'puzzles',
    initialState,
    reducers: {
        selectPuzzle: (state, action: PayloadAction<Puzzle | undefined>) => {
            state.selectedPuzzle = action.payload;
        },
        clearSelectedPuzzle: (state) => {
            state.selectedPuzzle = undefined;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch user puzzles
        builder.addCase(fetchUserPuzzles.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchUserPuzzles.fulfilled, (state, action) => {
            state.loading = false;
            state.puzzles = action.payload;
        });
        builder.addCase(fetchUserPuzzles.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Create puzzle
        builder.addCase(createPuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createPuzzleThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.puzzles.push(action.payload);
        });
        builder.addCase(createPuzzleThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Update puzzle
        builder.addCase(updatePuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(updatePuzzleThunk.fulfilled, (state, action) => {
            state.loading = false;
            const index = state.puzzles.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.puzzles[index] = action.payload;
            }
        });
        builder.addCase(updatePuzzleThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { selectPuzzle, clearSelectedPuzzle, clearError } = puzzlesSlice.actions;

// Selectors
export const selectPuzzles = (state: RootState) => state.puzzles.puzzles;
export const selectPuzzlesLoading = (state: RootState) => state.puzzles.loading;
export const selectPuzzlesError = (state: RootState) => state.puzzles.error;
export const selectSelectedPuzzle = (state: RootState) => state.puzzles.selectedPuzzle;

export default puzzlesSlice.reducer;

