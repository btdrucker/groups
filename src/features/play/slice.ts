import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Puzzle } from '../../firebase/firestore';
import { AppDispatch } from '../../common/store';
import { navigateToPlay } from '../app/slice';

interface PlayState {
    puzzle?: Puzzle;
}

const initialState: PlayState = {
    puzzle: undefined,
};

const playSlice = createSlice({
    name: 'play',
    initialState,
    reducers: {
        setPuzzle: (state, action: PayloadAction<Puzzle>) => {
            state.puzzle = action.payload;
        },
        clearPuzzle: (state) => {
            state.puzzle = undefined;
        },
    },
});

const { setPuzzle, clearPuzzle } = playSlice.actions;

// Thunk action that sets puzzle and navigates to Play mode
export const playPuzzle = (puzzle: Puzzle) => (dispatch: AppDispatch) => {
    dispatch(setPuzzle(puzzle));
    dispatch(navigateToPlay());
};

export const selectPuzzle = (state: any): Puzzle => state.play.puzzle!;

export default playSlice.reducer;

