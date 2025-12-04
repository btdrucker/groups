import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
    Puzzle,
    createPuzzle as createPuzzleFirestore,
    updatePuzzle as updatePuzzleFirestore,
    deletePuzzle as deletePuzzleFirestore
} from '../../firebase/firestore';
import {AppDispatch} from "../../common/store";
import {navigateToCompose, navigateToPlay} from "../app/slice";

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

        // Delete puzzle
        builder.addCase(deletePuzzleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(deletePuzzleThunk.fulfilled, (state, action) => {
            state.loading = false;
        });
        builder.addCase(deletePuzzleThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

const { setPuzzle, clearPuzzle, clearError } = composeSlice.actions;

// Thunk action that sets puzzle and navigates to Compose mode
export const composeNewPuzzle = () => (dispatch: AppDispatch) => {
    dispatch(clearPuzzle());
    dispatch(navigateToCompose());
};

// Thunk action that sets puzzle and navigates to Compose mode
export const composePuzzle = (puzzle: Puzzle) => (dispatch: AppDispatch) => {
    dispatch(setPuzzle(puzzle));
    dispatch(navigateToCompose());
};

export const selectPuzzle = (state: any): Puzzle => state.compose.puzzle!;

export default composeSlice.reducer;
