import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {Puzzle} from "../../firebase/firestore";

export enum AppMode {
    ComposeList,
    Compose,
    Play,
    PlayList,
}

interface AppState {
    appMode: AppMode;
    currentPuzzle?: Puzzle;
}

const initialState: AppState = {
    appMode: AppMode.ComposeList,
    currentPuzzle: undefined,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        navigateToComposeList: (state) => {
            state.currentPuzzle = undefined;
            state.appMode = AppMode.ComposeList;
        },
        composePuzzle: (state, action: PayloadAction<Puzzle>) => {
            state.currentPuzzle = action.payload;
            state.appMode = AppMode.Compose;
        },
        composeNewPuzzle: (state) => {
            state.currentPuzzle = undefined;
            state.appMode = AppMode.Compose;
        },
        playPuzzle: (state, action: PayloadAction<Puzzle>) => {
            state.currentPuzzle = action.payload;
            state.appMode = AppMode.Play;
        },
        navigateToPlayList: (state) => {
            state.currentPuzzle = undefined;
            state.appMode = AppMode.PlayList;
        },
    },
});

export const { navigateToComposeList, composePuzzle, composeNewPuzzle, playPuzzle, navigateToPlayList } = appSlice.actions;

export const selectAppMode = (state: any): AppMode => state.app.appMode;
export const selectCurrentPuzzle = (state: any): Puzzle => state.app.currentPuzzle;

export default appSlice.reducer;

