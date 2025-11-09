import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {Puzzle, getUserPuzzles} from '../../firebase/firestore';
import {RootState} from '../../common/store';

interface PuzzlesState {
    puzzles: Puzzle[];
    loading: boolean;
    error: string | null;
}

const initialState: PuzzlesState = {
    puzzles: [],
    loading: false,
    error: null,
};

export const fetchUserPuzzles = createAsyncThunk(
    'puzzle-list/fetchUserPuzzles',
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
    },
    extraReducers: (builder) => {
        // Fetch user puzzle-list
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

export const selectPuzzles = (state: RootState) => state.puzzles.puzzles;
export const selectPuzzlesLoading = (state: RootState) => state.puzzles.loading;
export const selectPuzzlesError = (state: RootState) => state.puzzles.error;

export default puzzlesSlice.reducer;

