import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { GameState, getUserGameStates, getPuzzle, Puzzle } from '../../firebase/firestore';
import { RootState } from '../../common/store';

// Helper function to check if a guess matches a category
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    const categoryMask = 0b1111 << (categoryIndex * 4);
    const guessMasked = guessNumber & categoryMask;
    return guessMasked === categoryMask && (guessNumber & ~categoryMask) === 0;
};

// Helper function to count correct guesses and mistakes for a game state
const countGuessStats = (gameState: GameState, puzzle: Puzzle | null): { correctGuesses: number; mistakes: number } => {
    if (!puzzle) return { correctGuesses: 0, mistakes: 0 };

    let correctCount = 0;
    let incorrectCount = 0;

    gameState.guesses.forEach(guessNumber => {
        let wasCorrect = false;
        for (let categoryIndex = 0; categoryIndex < puzzle.categories.length; categoryIndex++) {
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

export interface GameStateWithPuzzle {
    gameState: GameState;
    puzzle: Puzzle | null;
    correctGuesses: number;
    mistakes: number;
}

// Internal interface for state storage (without computed fields)
interface RawGameStateWithPuzzle {
    gameState: GameState;
    puzzle: Puzzle | null;
}

interface PlayListState {
    gameStatesWithPuzzles: RawGameStateWithPuzzle[];
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
    async (userId: string, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        if (state.playList.gameStatesWithPuzzles.length > 0) {
            // Already loaded, skip fetching
            return state.playList.gameStatesWithPuzzles;
        }
        const { gameStates, error } = await getUserGameStates(userId);
        if (error) {
            return rejectWithValue(error);
        }

        // Fetch the puzzle for each game state
        const gameStatesWithPuzzles: RawGameStateWithPuzzle[] = [];
        for (const gameState of gameStates) {
            const { puzzle, error: puzzleError } = await getPuzzle(gameState.puzzleId);
            gameStatesWithPuzzles.push({
                gameState,
                puzzle: puzzle || null,
            });
        }

        return gameStatesWithPuzzles;
    }
);

const playListSlice = createSlice({
    name: 'playList',
    initialState,
    reducers: {
        updateGameStateLocally: (state, action: PayloadAction<GameState>) => {
            const gameState = action.payload;
            const idx = state.gameStatesWithPuzzles.findIndex(gs => gs.gameState.puzzleId === gameState.puzzleId);
            if (idx !== -1) {
                state.gameStatesWithPuzzles[idx] = {
                    ...state.gameStatesWithPuzzles[idx],
                    gameState,
                };
            } else {
                console.error("Can't find game state to update locally:", gameState.id);
            }
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
    },
});

export const { updateGameStateLocally } = playListSlice.actions;

// Base selector for raw game states with puzzles from state
const selectRawGameStatesWithPuzzles = (state: RootState) => state.playList.gameStatesWithPuzzles;

// Memoized selector that adds computed values (correctGuesses and mistakes)
export const selectGameStatesWithPuzzles = createSelector(
    [selectRawGameStatesWithPuzzles],
    (gameStatesWithPuzzles): GameStateWithPuzzle[] => {
        // Sort: in-progress first, then won/lost, stable
        return [...gameStatesWithPuzzles]
            .map(({ gameState, puzzle }) => {
                const stats = countGuessStats(gameState, puzzle);
                return {
                    gameState,
                    puzzle,
                    ...stats,
                };
            })
            .sort((a, b) => {
                // Use isInProgress util for sorting
                const aInProgress = isInProgress({
                    ...a,
                    puzzle: a.puzzle as any,
                });
                const bInProgress = isInProgress({
                    ...b,
                    puzzle: b.puzzle as any,
                });
                if (aInProgress === bInProgress) return 0;
                return aInProgress ? -1 : 1;
            });
    }
);

export const selectGameStatesLoading = (state: RootState) => state.playList.loading;
export const selectGameStatesError = (state: RootState) => state.playList.error;

// Utility functions for derived puzzle/game state flags
export function totalCategories(puzzle: Puzzle | null): number {
    return puzzle ? puzzle.categories.length : 0;
}

export function isWon(gameStateWithPuzzle: GameStateWithPuzzle): boolean {
    return gameStateWithPuzzle.correctGuesses === totalCategories(gameStateWithPuzzle.puzzle);
}

export function isLost(gameStateWithPuzzle: GameStateWithPuzzle): boolean {
    return !isWon(gameStateWithPuzzle) && gameStateWithPuzzle.mistakes === totalCategories(gameStateWithPuzzle.puzzle);
}

export function isInProgress(gameStateWithPuzzle: GameStateWithPuzzle): boolean {
    return !isWon(gameStateWithPuzzle) && !isLost(gameStateWithPuzzle);
}

export default playListSlice.reducer;
