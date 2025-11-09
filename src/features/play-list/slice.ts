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
    selectedGameStateId: string | null;
    gameStatesWithPuzzles: RawGameStateWithPuzzle[];
    loading: boolean;
    error: string | null;
}

const initialState: PlayListState = {
    selectedGameStateId: null,
    gameStatesWithPuzzles: [],
    loading: false,
    error: null,
};

export const fetchUserGameStates = createAsyncThunk(
    'playList/fetchUserGameStates',
    async (userId: string, { rejectWithValue }) => {
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
        setSelectedGameState: (state, action: PayloadAction<string | null>) => {
            state.selectedGameStateId = action.payload;
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

export const { setSelectedGameState } = playListSlice.actions;

// Selectors
export const selectSelectedGameStateId = (state: RootState) => state.playList.selectedGameStateId;

// Base selector for raw game states with puzzles from state
const selectRawGameStatesWithPuzzles = (state: RootState) => state.playList.gameStatesWithPuzzles;

// Memoized selector that adds computed values (correctGuesses and mistakes)
export const selectGameStatesWithPuzzles = createSelector(
    [selectRawGameStatesWithPuzzles],
    (gameStatesWithPuzzles): GameStateWithPuzzle[] => {
        return gameStatesWithPuzzles.map(({ gameState, puzzle }) => {
            const stats = countGuessStats(gameState, puzzle);
            return {
                gameState,
                puzzle,
                ...stats,
            };
        });
    }
);

export const selectGameStatesLoading = (state: RootState) => state.playList.loading;
export const selectGameStatesError = (state: RootState) => state.playList.error;

export default playListSlice.reducer;

