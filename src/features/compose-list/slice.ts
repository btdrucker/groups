import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {Puzzle, getUserPuzzles} from '../../firebase/firestore';
import {RootState} from '../../common/store';

interface ComposeListState {
    puzzles: Puzzle[];
    loading: boolean;
    error: string | null;
}

const initialState: ComposeListState = {
    puzzles: [],
    loading: false,
    error: null,
};

export const fetchUserPuzzles = createAsyncThunk(
    'compose-list/fetchUserPuzzles',
    async (userId: string, {rejectWithValue}) => {
        const {puzzles, error} = await getUserPuzzles(userId);
        if (error) {
            return rejectWithValue(error);
        }
        return puzzles;
    }
);

const composeListSlice = createSlice({
    name: 'compose-list',
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        // Fetch user compose-list
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

export const selectPuzzles = (state: RootState) => state.composeList.puzzles;
export const selectPuzzlesLoading = (state: RootState) => state.composeList.loading;
export const selectPuzzlesError = (state: RootState) => state.composeList.error;

export default composeListSlice.reducer;

