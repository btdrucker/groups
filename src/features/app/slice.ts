import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export enum AppMode {
    ComposeList,
    Compose,
    Play,
    PlayList,
}

interface AppState {
    appMode: AppMode;
    pendingPuzzleId?: string;
}

const initialState: AppState = {
    appMode: AppMode.ComposeList,
    pendingPuzzleId: undefined,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        navigateToCompose: (state) => {
            state.appMode = AppMode.Compose;
        },
        navigateToComposeList: (state) => {
            state.appMode = AppMode.ComposeList;
        },
        navigateToPlay: (state) => {
            state.appMode = AppMode.Play;
        },
        navigateToPlayList: (state) => {
            state.appMode = AppMode.PlayList;
        },
        setPendingPuzzleId: (state, action: PayloadAction<string | undefined>) => {
            state.pendingPuzzleId = action.payload;
        },
    },
});

export const {navigateToCompose, navigateToComposeList, navigateToPlay, navigateToPlayList, setPendingPuzzleId} = appSlice.actions;

export const selectAppMode = (state: any): AppMode => state.app.appMode;
export const selectPendingPuzzleId = (state: any): string | undefined => state.app.pendingPuzzleId;

export default appSlice.reducer;

