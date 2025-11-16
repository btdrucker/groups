import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Puzzle, getPuzzle } from '../../firebase/firestore';
import { AppDispatch } from '../../common/store';
import { navigateToPlay } from '../app/slice';

interface PlayState {
    puzzle?: Puzzle;
    loading: boolean;
    error: string | null;
}

const initialState: PlayState = {
    puzzle: undefined,
    loading: false,
    error: null,
};

export const loadPuzzleById = createAsyncThunk(
    'play/loadPuzzleById',
    async (puzzleId: string, { rejectWithValue }) => {
        const { puzzle, error } = await getPuzzle(puzzleId);
        if (error || !puzzle) {
            return rejectWithValue(error || 'Puzzle not found');
        }
        return puzzle;
    }
);

const playSlice = createSlice({
    name: 'play',
    initialState,
    reducers: {
        setPuzzle: (state, action: PayloadAction<Puzzle>) => {
            state.puzzle = action.payload;
            state.error = null;
        },
        clearPuzzle: (state) => {
            state.puzzle = undefined;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadPuzzleById.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadPuzzleById.fulfilled, (state, action) => {
            state.loading = false;
            state.puzzle = action.payload;
            state.error = null;
        });
        builder.addCase(loadPuzzleById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
            state.puzzle = undefined;
        });
    },
});

const { setPuzzle, clearPuzzle } = playSlice.actions;

// Thunk action that sets puzzle and navigates to Play mode
export const playPuzzle = (puzzle: Puzzle) => (dispatch: AppDispatch) => {
    dispatch(setPuzzle(puzzle));
    dispatch(navigateToPlay());
};

export const selectPuzzle = (state: any): Puzzle | undefined => state.play.puzzle;
export const selectPlayLoading = (state: any): boolean => state.play.loading;
export const selectPlayError = (state: any): string | null => state.play.error;
export const selectAvailableMistakes = (state: any): number => state.play.puzzle?.categories?.length || 0;
export const selectNumCategories = (state: any): number => state.play.puzzle?.categories?.length || 0;
export const selectWordsPerCategory = (state: any): number => (state.play.puzzle?.words || 0) / (state.play.puzzle?.categories?.length || 1);

export default playSlice.reducer;
