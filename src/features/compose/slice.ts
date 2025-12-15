import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
    Puzzle,
    createPuzzle as createPuzzleFirestore,
    updatePuzzle as updatePuzzleFirestore,
    deletePuzzle as deletePuzzleFirestore,
    getPuzzle
} from '../../firebase/firestore';

interface PuzzlesState {
    puzzle?: Puzzle;
    loading: boolean;
    error: string | null;
}

const initialState: PuzzlesState = {
    puzzle: undefined,
    loading: false,
    error: null,
};

export const loadPuzzleById = createAsyncThunk(
    'compose/loadPuzzleById',
    async (puzzleId: string, { rejectWithValue, getState }) => {
        const state: any = getState();
        const fromList = state.composeList?.puzzles?.find((p: Puzzle) => p.id === puzzleId);
        if (fromList) return fromList;
        // Fetch only the single puzzle from Firestore
        const { puzzle, error } = await getPuzzle(puzzleId);
        if (error || !puzzle) return rejectWithValue(error || 'Puzzle not found');
        return puzzle;
    }
);

export const createPuzzleThunk = createAsyncThunk(
    'compose/createPuzzle',
    async (puzzle: Puzzle, { rejectWithValue }) => {
        const { id, error } = await createPuzzleFirestore(puzzle);
        if (error || !id) {
            return rejectWithValue(error || 'Failed to create puzzle');
        }
        return { ...puzzle, id };
    }
);

export const updatePuzzleThunk = createAsyncThunk(
    'compose/updatePuzzle',
    async (puzzle: Puzzle, { rejectWithValue }) => {
        const { error } = await updatePuzzleFirestore(puzzle);
        if (error) {
            return rejectWithValue(error);
        }
        return puzzle;
    }
);

export const deletePuzzleThunk = createAsyncThunk(
    'compose/deletePuzzle',
    async (puzzleId: string, { rejectWithValue }) => {
        const { error } = await deletePuzzleFirestore(puzzleId);
        if (error) {
            return rejectWithValue(error);
        }
        return puzzleId;
    }
);

const composeSlice = createSlice({
    name: 'compose',
    initialState,
    reducers: {
        setPuzzle: (state, action: PayloadAction<Puzzle>) => {
            state.puzzle = action.payload;
        },
        clearPuzzle: (state) => {
            state.puzzle = undefined;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadPuzzleById.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadPuzzleById.fulfilled, (state, action: PayloadAction<Puzzle>) => {
            state.loading = false;
            state.puzzle = action.payload;
        });
        builder.addCase(loadPuzzleById.rejected, (state, action: PayloadAction<unknown>) => {
            state.loading = false;
            state.error = typeof action.payload === 'string' ? action.payload : null;
        });
        // Create puzzle
        builder.addCase(createPuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createPuzzleThunk.fulfilled, (state, action: PayloadAction<Puzzle>) => {
            state.loading = false;
            state.puzzle = action.payload;
        });
        builder.addCase(createPuzzleThunk.rejected, (state, action: PayloadAction<unknown>) => {
            state.loading = false;
            state.error = typeof action.payload === 'string' ? action.payload : null;
        });
        // Update puzzle
        builder.addCase(updatePuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(updatePuzzleThunk.fulfilled, (state, action: PayloadAction<Puzzle>) => {
            state.loading = false;
            state.puzzle = action.payload;
        });
        builder.addCase(updatePuzzleThunk.rejected, (state, action: PayloadAction<unknown>) => {
            state.loading = false;
            state.error = typeof action.payload === 'string' ? action.payload : null;
        });
        // Delete puzzle
        builder.addCase(deletePuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(deletePuzzleThunk.fulfilled, (state) => {
            state.loading = false;
            state.puzzle = undefined;
        });
        builder.addCase(deletePuzzleThunk.rejected, (state, action: PayloadAction<unknown>) => {
            state.loading = false;
            state.error = typeof action.payload === 'string' ? action.payload : null;
        });
    },
});

export const { setPuzzle, clearPuzzle, clearError } = composeSlice.actions;

export const selectPuzzle = (state: any): Puzzle | undefined => state.compose.puzzle;

export default composeSlice.reducer;
