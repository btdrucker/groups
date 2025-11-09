import {createSlice} from '@reduxjs/toolkit';

export enum AppMode {
    ComposeList,
    Compose,
    Play,
    PlayList,
}

interface AppState {
    appMode: AppMode;
}

const initialState: AppState = {
    appMode: AppMode.ComposeList,
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
    },
});

export const {navigateToCompose, navigateToComposeList, navigateToPlay, navigateToPlayList} = appSlice.actions;

export const selectAppMode = (state: any): AppMode => state.app.appMode;

export default appSlice.reducer;

