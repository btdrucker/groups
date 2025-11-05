import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {Puzzle, getUserPuzzles} from '../../firebase/firestore';
import {RootState} from '../../common/store';

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
    async (userId: string, {rejectWithValue}) => {
        const {puzzles, error} = await getUserPuzzles(userId);
        if (error) {
            return rejectWithValue(error);
        }
        return puzzles;
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
    },
});

export const {selectPuzzle, clearSelectedPuzzle, clearError} = puzzlesSlice.actions;

export const selectPuzzles = (state: RootState) => state.puzzles.puzzles;
export const selectPuzzlesLoading = (state: RootState) => state.puzzles.loading;
export const selectPuzzlesError = (state: RootState) => state.puzzles.error;
export const selectSelectedPuzzle = (state: RootState) => state.puzzles.selectedPuzzle;

export default puzzlesSlice.reducer;

