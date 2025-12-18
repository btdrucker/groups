import {createSlice, createAsyncThunk, createSelector, PayloadAction} from '@reduxjs/toolkit';
import {Puzzle, getUserPuzzles} from '../../firebase/firestore';
import {createPuzzleThunk, updatePuzzleThunk, deletePuzzleThunk} from '../compose/slice';

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
    const hasAllGroups = puzzle.categories.length === puzzle.numGroups &&
        puzzle.categories.every(group => group && group.trim() !== '');
    const hasAllWords = puzzle.words.length === (puzzle.numGroups * puzzle.wordsPerGroup) &&
        puzzle.words.every(word => word && word.trim() !== '');
    return hasAllGroups && hasAllWords;
};

const composeListSlice = createSlice({
    name: 'compose-list',
    initialState,
    reducers: {
        upsertPuzzle: (state, action: PayloadAction<Puzzle>) => {
            const puzzle = action.payload;
            const index = state.puzzles.findIndex(p => p.id === puzzle.id);
            if (index !== -1) {
                state.puzzles[index] = puzzle;
            } else {
                state.puzzles.push(puzzle);
            }
        },
        removePuzzle: (state, action: PayloadAction<string>) => {
            state.puzzles = state.puzzles.filter(p => p.id !== action.payload);
        },
        clearPuzzlesCache: (state) => {
            // Clear puzzles to force a fresh load from Firestore
            state.puzzles = [];
        },
    },
    extraReducers: (builder) => {
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
        // Listen to compose actions to keep list in sync
        builder.addCase(createPuzzleThunk.fulfilled, (state, action) => {
            // Add newly created puzzle to the list
            state.puzzles.push(action.payload);
        });
        builder.addCase(updatePuzzleThunk.fulfilled, (state, action) => {
            // Update existing puzzle in the list
            const index = state.puzzles.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.puzzles[index] = action.payload;
            }
        });
        builder.addCase(deletePuzzleThunk.fulfilled, (state, action) => {
            // Remove deleted puzzle from the list
            state.puzzles = state.puzzles.filter(p => p.id !== action.payload);
        });
    },
});

export const { upsertPuzzle, removePuzzle, clearPuzzlesCache } = composeListSlice.actions;

// Stable sort: incomplete puzzles first, preserve order otherwise
export const selectPuzzles = createSelector(
    [(state: any) => (state as any).composeList.puzzles],
    (puzzles) => {
        return [...puzzles].sort((a, b) => {
            const aComplete = isPuzzleComplete(a);
            const bComplete = isPuzzleComplete(b);
            if (aComplete === bComplete) return 0;
            return aComplete ? 1 : -1;
        });
    }
);
export const selectPuzzlesLoading = (state: any) => (state as any).composeList.loading;
export const selectPuzzlesError = (state: any) => (state as any).composeList.error;

export default composeListSlice.reducer;
