import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    Puzzle,
    createPuzzle as createPuzzleFirestore,
    updatePuzzle as updatePuzzleFirestore
} from '../../firebase/firestore';
import { RootState } from '../../common/store';

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

export const createPuzzleThunk = createAsyncThunk(
    'puzzle-list/createPuzzle',
    async ({ puzzle, userId }: { puzzle: Puzzle; userId: string }, { rejectWithValue }) => {
        const { id, error } = await createPuzzleFirestore(puzzle, userId);
        if (error || !id) {
            return rejectWithValue(error || 'Failed to create puzzle');
        }
        return { ...puzzle, id, creatorId: userId };
    }
);

export const updatePuzzleThunk = createAsyncThunk(
    'puzzle-list/updatePuzzle',
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

export default puzzlesSlice.reducer;

