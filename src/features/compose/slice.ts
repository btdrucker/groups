import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    Puzzle,
    createPuzzle as createPuzzleFirestore,
    updatePuzzle as updatePuzzleFirestore
} from '../../firebase/firestore';

interface PuzzlesState {
    loading: boolean;
    error: string | null;
}

const initialState: PuzzlesState = {
    loading: false,
    error: null,
};

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

const composeSlice = createSlice({
    name: 'compose',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Create puzzle
        builder.addCase(createPuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createPuzzleThunk.fulfilled, (state, action) => {
            state.loading = false;
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
        });
        builder.addCase(updatePuzzleThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export default composeSlice.reducer;
