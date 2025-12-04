import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../common/store';
import { fetchUserGameStates, selectGameStatesWithPuzzles } from '../play-list/slice';

interface PlayState {
    loading: boolean;
    error: string | null;
}

const initialState: PlayState = {
    loading: false,
    error: null,
};

// Thunk to ensure PlayList loads required game state/puzzle
export const ensureGameStateLoaded = createAsyncThunk<
    void,
    string,
    { state: RootState; dispatch: any }
>(
    'play/ensureGameStateLoaded',
    async (gameStateId, { getState, dispatch }) => {
        const state = getState();
        const gameStatesWithPuzzles = selectGameStatesWithPuzzles(state);
        const found = gameStatesWithPuzzles.find(gsp => gsp.gameState.id === gameStateId);
        if (!found) {
            // Dispatch PlayList thunk to load game states (assumes userId is available in auth state)
            const userId = state.auth.user?.uid;
            if (userId) {
                await dispatch(fetchUserGameStates(userId));
            }
        }
    }
);

// Selector to get game state and puzzle by ID from PlayList state
export const selectGameStateWithPuzzleById = (state: RootState, puzzleId: string) => {
    const gameStatesWithPuzzles = selectGameStatesWithPuzzles(state);
    return gameStatesWithPuzzles.find(gsp => gsp.gameState.puzzleId === puzzleId);
};

const playSlice = createSlice({
    name: 'play',
    initialState,
    reducers: {
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(ensureGameStateLoaded.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(ensureGameStateLoaded.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(ensureGameStateLoaded.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || null;
        });
    },
});

export const { setError } = playSlice.actions;
export const selectPlayLoading = (state: RootState): boolean => state.play.loading;
export const selectPlayError = (state: RootState): string | null => state.play.error;

export default playSlice.reducer;
