import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { GameState, getUserGameStates, getPuzzle, Puzzle, getGameState, saveGameState } from '../../firebase/firestore';
import { RootState } from '../../common/store';

// Helper function to check if a guess matches a category
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    // A guess is correct if all words in the category are selected
    const wordsPerCategory = 4;  // TODO: Make this dynamic based on game state
    const categoryMask = ((1 << wordsPerCategory) - 1) << (categoryIndex * wordsPerCategory);
    const guessMasked = guessNumber & categoryMask;
    // Check if all bits in the category are set
    return guessMasked === categoryMask;
};

// Helper function to count correct guesses and mistakes for a game state
const countGuessStats = (gameState: GameState): { correctGuesses: number; mistakes: number } => {
    const numGroups = gameState.numGroups;

    let correctCount = 0;
    let incorrectCount = 0;

    gameState.guesses.forEach(guessNumber => {
        let wasCorrect = false;
        for (let categoryIndex = 0; categoryIndex < numGroups; categoryIndex++) {
            if (isGuessCorrect(guessNumber, categoryIndex)) {
                correctCount++;
                wasCorrect = true;
                break;
            }
        }
        if (!wasCorrect) {
            incorrectCount++;
        }
    });

    return { correctGuesses: correctCount, mistakes: incorrectCount };
};

// Internal storage interface (what's actually stored in state)
interface RawGameStateWithPuzzle {
    gameState: GameState;
    puzzle: Puzzle | null; // null for list display, loaded Puzzle for Play component
}

// Public interface with computed fields (what selectors return)
export interface GameStateWithPuzzle {
    gameState: GameState;
    puzzle: Puzzle | null;
    correctGuesses: number;
    mistakes: number;
}

interface PlayListState {
    gameStatesWithPuzzles: RawGameStateWithPuzzle[]; // Single source of truth
    loading: boolean;
    error: string | null;
}

const initialState: PlayListState = {
    gameStatesWithPuzzles: [],
    loading: false,
    error: null,
};

export const fetchUserGameStates = createAsyncThunk(
    'playList/fetchUserGameStates',
    async ({ userId, force = false }: { userId: string; force?: boolean }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        if (!force && state.playList.gameStatesWithPuzzles.length > 0) {
            // Already loaded, skip fetching (unless force is true)
            return state.playList.gameStatesWithPuzzles;
        }
        const { gameStates, error } = await getUserGameStates(userId);
        if (error) {
            return rejectWithValue(error);
        }

        // Map to GameStateWithPuzzleStorage with null puzzles (loaded on demand)
        return gameStates.map(gameState => ({ gameState, puzzle: null }));
    }
);

// Helper: Get puzzle from cache or Firestore
async function getPuzzleFromCacheOrFirestore(
    puzzleId: string,
    cachedPuzzle: Puzzle | null
): Promise<{ puzzle: Puzzle | null; error: string | null }> {
    // Return cached puzzle if available
    if (cachedPuzzle) {
        return { puzzle: cachedPuzzle, error: null };
    }

    // Fetch from Firestore
    const { puzzle, error } = await getPuzzle(puzzleId);
    if (error || !puzzle) {
        return { puzzle: null, error: error || 'Puzzle not found' };
    }

    return { puzzle, error: null };
}

// Helper: Get game state from cache or Firestore (or create new)
async function getGameStateFromCacheOrFirestore(
    userId: string,
    puzzleId: string,
    cachedGameState: GameState | undefined,
    puzzle: Puzzle
): Promise<{ gameState: GameState; error: string | null }> {
    // Return cached game state if available
    if (cachedGameState) {
        return { gameState: cachedGameState, error: null };
    }

    // Try to fetch from Firestore
    const { gameState, error } = await getGameState(userId, puzzleId);
    if (error) {
        return { gameState: null as any, error };
    }

    // If not found in Firestore, create a new game state with denormalized metadata
    if (!gameState) {
        const newGameState: GameState = {
            userId,
            puzzleId,
            guesses: [],
            creatorName: puzzle.creatorName,
            createdAt: puzzle.createdAt ?? Date.now(),
            numGroups: puzzle.numGroups,
            wordsPerGroup: puzzle.wordsPerGroup,
        };
        return { gameState: newGameState, error: null };
    }

    return { gameState, error: null };
}

// Thunk to load a single game state (and its puzzle) by puzzleId for the current user
export const loadGameStateWithPuzzle = createAsyncThunk<
    { gameState: GameState; puzzle: Puzzle | null },
    { userId: string; puzzleId: string },
    { state: RootState }
>(
    'playList/loadGameStateWithPuzzle',
    async ({ userId, puzzleId }, { getState, rejectWithValue }) => {
        const state = getState();
        const existing = state.playList.gameStatesWithPuzzles.find(
            gsp => gsp.gameState.puzzleId === puzzleId && gsp.gameState.userId === userId
        );

        // If we already have both, return immediately
        if (existing?.gameState && existing?.puzzle) {
            return { gameState: existing.gameState, puzzle: existing.puzzle };
        }

        // Get puzzle (from cache or Firestore)
        const { puzzle, error: puzzleError } = await getPuzzleFromCacheOrFirestore(
            puzzleId,
            existing?.puzzle || null
        );
        if (puzzleError || !puzzle) {
            return rejectWithValue(puzzleError || 'Puzzle not found');
        }

        // Get game state (from cache, Firestore, or create new)
        const { gameState, error: gameStateError } = await getGameStateFromCacheOrFirestore(
            userId,
            puzzleId,
            existing?.gameState,
            puzzle
        );
        if (gameStateError) {
            return rejectWithValue(gameStateError);
        }

        return { gameState, puzzle };
    }
);

// Thunk to save/update a game state and update the slice locally
export const saveAndUpdateGameState = createAsyncThunk<
    GameState,
    { gameState: GameState },
    { state: RootState }
>(
    'playList/saveAndUpdateGameState',
    async ({ gameState }, { dispatch, rejectWithValue }) => {
        const { id, error } = await saveGameState(gameState);
        if (error) return rejectWithValue(error);
        // Only include id if it is a string
        const updatedGameState = id ? { ...gameState, id } : { ...gameState };
        dispatch(updateGameStateLocally(updatedGameState));
        return updatedGameState;
    }
);

const playListSlice = createSlice({
    name: 'playList',
    initialState,
    reducers: {
        updateGameStateLocally: (state, action: PayloadAction<GameState>) => {
            const gameState = action.payload;
            const idx = state.gameStatesWithPuzzles.findIndex(gsp => gsp.gameState.puzzleId === gameState.puzzleId);
            if (idx !== -1) {
                state.gameStatesWithPuzzles[idx].gameState = gameState;
            } else {
                console.error("Can't find game state to update locally:", gameState.id);
            }
        },
        clearGameStatesCache: (state) => {
            // Clear game states to force a fresh load from Firestore
            state.gameStatesWithPuzzles = [];
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUserGameStates.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchUserGameStates.fulfilled, (state, action) => {
            state.loading = false;
            state.gameStatesWithPuzzles = action.payload;
        });
        builder.addCase(fetchUserGameStates.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
        builder.addCase(loadGameStateWithPuzzle.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(loadGameStateWithPuzzle.fulfilled, (state, action) => {
            state.loading = false;
            const { gameState, puzzle } = action.payload;

            // Update or add to gameStatesWithPuzzles
            const idx = state.gameStatesWithPuzzles.findIndex(gsp => gsp.gameState.puzzleId === gameState.puzzleId);
            if (idx !== -1) {
                state.gameStatesWithPuzzles[idx] = { gameState, puzzle };
            } else {
                state.gameStatesWithPuzzles.push({ gameState, puzzle });
            }
        });
        builder.addCase(loadGameStateWithPuzzle.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
        builder.addCase(saveAndUpdateGameState.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(saveAndUpdateGameState.fulfilled, (state, action) => {
            state.loading = false;
            const updatedGameState = action.payload;
            const idx = state.gameStatesWithPuzzles.findIndex(gsp => gsp.gameState.puzzleId === updatedGameState.puzzleId);
            if (idx !== -1) {
                // Update existing
                state.gameStatesWithPuzzles[idx].gameState = updatedGameState;
            } else {
                // Add new (without puzzle since we're just saving game state)
                state.gameStatesWithPuzzles.push({ gameState: updatedGameState, puzzle: null });
            }
        });
        builder.addCase(saveAndUpdateGameState.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { updateGameStateLocally, clearGameStatesCache } = playListSlice.actions;

// Memoized selector that adds computed values (correctGuesses and mistakes)
export const selectGameStatesWithPuzzles = createSelector(
    [(state: RootState) => state.playList.gameStatesWithPuzzles],
    (gameStatesWithPuzzles): GameStateWithPuzzle[] => {
        // Guard against undefined/null during redux-persist rehydration
        if (!gameStatesWithPuzzles) {
            return [];
        }

        // Ensure it's an array
        if (!Array.isArray(gameStatesWithPuzzles)) {
            console.error('gameStatesWithPuzzles is not an array:', gameStatesWithPuzzles);
            return [];
        }

        // Sort: in-progress first, then won/lost, stable
        return [...gameStatesWithPuzzles]
            .filter(gsp => gsp && gsp.gameState) // Filter out any invalid entries
            .map(({ gameState }) => {
                const stats = countGuessStats(gameState);
                return {
                    gameState,
                    puzzle: null, // Puzzle is null for list display
                    ...stats,
                };
            })
            .sort((a, b) => {
                // Use isInProgress util for sorting
                const aInProgress = isInProgress(a);
                const bInProgress = isInProgress(b);
                if (aInProgress === bInProgress) return 0;
                return aInProgress ? -1 : 1;
            });
    }
);

export const selectPlayListLoading = (state: RootState) => state.playList.loading;
export const selectPlayListError = (state: RootState) => state.playList.error;

export const selectGameStatesLoading = (state: RootState) => state.playList.loading;
export const selectGameStatesError = (state: RootState) => state.playList.error;

// Utility functions for derived puzzle/game state flags
export function totalCategories(gameStateWithPuzzle: GameStateWithPuzzle): number {
    return gameStateWithPuzzle.gameState.numGroups;
}

export function isWon(gameStateWithPuzzle: GameStateWithPuzzle): boolean {
    return gameStateWithPuzzle.correctGuesses === totalCategories(gameStateWithPuzzle);
}

export function isLost(gameStateWithPuzzle: GameStateWithPuzzle): boolean {
    return !isWon(gameStateWithPuzzle) && gameStateWithPuzzle.mistakes === totalCategories(gameStateWithPuzzle);
}

export function isInProgress(gameStateWithPuzzle: GameStateWithPuzzle): boolean {
    return !isWon(gameStateWithPuzzle) && !isLost(gameStateWithPuzzle);
}

export default playListSlice.reducer;
