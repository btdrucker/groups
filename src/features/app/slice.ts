import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type View = 'list' | 'composer';

interface AppState {
    currentView: View;
}

const initialState: AppState = {
    currentView: 'list',
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setCurrentView: (state, action: PayloadAction<View>) => {
            state.currentView = action.payload;
        },
        navigateToList: (state) => {
            state.currentView = 'list';
        },
        navigateToComposer: (state) => {
            state.currentView = 'composer';
        },
    },
});

export const { setCurrentView, navigateToList, navigateToComposer } = appSlice.actions;

// Selectors
export const selectCurrentView = (state: any) => state.app.currentView;

export default appSlice.reducer;

