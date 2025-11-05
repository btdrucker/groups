import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type View = 'compose-list' | 'composer' | 'player' | 'play-list';

interface AppState {
    currentView: View;
}

const initialState: AppState = {
    currentView: 'compose-list',
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setCurrentView: (state, action: PayloadAction<View>) => {
            state.currentView = action.payload;
        },
        navigateToList: (state) => {
            state.currentView = 'compose-list';
        },
        navigateToComposer: (state) => {
            state.currentView = 'composer';
        },
        navigateToPlayer: (state) => {
            state.currentView = 'player';
        },
        navigateToPlayList: (state) => {
            state.currentView = 'play-list';
        },
    },
});

export const { setCurrentView, navigateToList, navigateToComposer, navigateToPlayer, navigateToPlayList } = appSlice.actions;

// Selectors
export const selectCurrentView = (state: any) => state.app.currentView;

export default appSlice.reducer;

