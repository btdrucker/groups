import {createSlice, createAsyncThunk, createSelector} from '@reduxjs/toolkit';
import {Puzzle, getUserPuzzles, updatePuzzle, deletePuzzle} from '../../firebase/firestore';
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

export const isPuzzleComplete = (puzzle: Puzzle): boolean => {
    const hasAllCategories = puzzle.categories.length === 4 &&
        puzzle.categories.every(cat => cat && cat.trim() !== '');
    const hasAllWords = puzzle.words.length === 16 &&
        puzzle.words.every(word => word && word.trim() !== '');
    return hasAllCategories && hasAllWords;
};

const composeListSlice = createSlice({
    name: 'compose-list',
    initialState,
    reducers: {
        updatePuzzleLocally: (state, action) => {
            const updated = action.payload;
            const idx = state.puzzles.findIndex(p => p.id === updated.id);
            if (idx !== -1) {
                state.puzzles[idx] = updated;
            }
        },
        deletePuzzleLocally: (state, action) => {
            const id = action.payload;
            state.puzzles = state.puzzles.filter(p => p.id !== id);
        },
        createPuzzleLocally: (state, action) => {
            const newPuzzle = action.payload;
            // Avoid duplicates
            if (!state.puzzles.some(p => p.id === newPuzzle.id)) {
                state.puzzles.push(newPuzzle);
            }
        },
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

export const { updatePuzzleLocally, deletePuzzleLocally, createPuzzleLocally } = composeListSlice.actions;

// Thunk for updating a puzzle remotely and locally
export const updatePuzzleThunkLocal = createAsyncThunk(
    'compose-list/updatePuzzleThunkLocal',
    async (puzzle: Puzzle, {dispatch, rejectWithValue}) => {
        try {
            await updatePuzzle(puzzle);
            dispatch(updatePuzzleLocally(puzzle));
            return puzzle;
        } catch (err) {
            return rejectWithValue('Failed to update puzzle');
        }
    }
);

// Thunk for deleting a puzzle remotely and locally
export const deletePuzzleThunkLocal = createAsyncThunk(
    'compose-list/deletePuzzleThunkLocal',
    async (id: string, {dispatch, rejectWithValue}) => {
        try {
            await deletePuzzle(id);
            dispatch(deletePuzzleLocally(id));
            return id;
        } catch (err) {
            return rejectWithValue('Failed to delete puzzle');
        }
    }
);

// Stable sort: incomplete puzzles first, preserve order otherwise
export const selectPuzzles = createSelector(
    [(state: RootState) => state.composeList.puzzles],
    (puzzles) => {
        return [...puzzles].sort((a, b) => {
            const aComplete = isPuzzleComplete(a);
            const bComplete = isPuzzleComplete(b);
            if (aComplete === bComplete) return 0;
            return aComplete ? 1 : -1;
        });
    }
);
export const selectPuzzlesLoading = (state: RootState) => state.composeList.loading;
export const selectPuzzlesError = (state: RootState) => state.composeList.error;

export default composeListSlice.reducer;
