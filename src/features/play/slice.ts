import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../common/store';
import { fetchUserGameStates, selectGameStatesWithPuzzles, addGameStateWithPuzzle } from '../play-list/slice';
import { getPuzzle } from '../../firebase/firestore';

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
            const userId = state.auth.user?.uid;
            if (userId) {
                await dispatch(fetchUserGameStates(userId));
                // Re-check after fetching
                const updatedState = getState();
                const updatedGameStatesWithPuzzles = selectGameStatesWithPuzzles(updatedState);
                const foundAfterFetch = updatedGameStatesWithPuzzles.find(gsp => gsp.gameState.id === gameStateId);
                if (!foundAfterFetch) {
                    // Fallback: fetch puzzle directly by ID
                    const { puzzle, error } = await getPuzzle(gameStateId);
                    if (puzzle) {
                        dispatch(addGameStateWithPuzzle({
                            gameState: {
                                id: gameStateId,
                                userId,
                                puzzleId: gameStateId,
                                guesses: []
                            },
                            puzzle
                        }));
                    } else {
                        throw new Error('PUZZLE_NOT_FOUND');
                    }
                }
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
