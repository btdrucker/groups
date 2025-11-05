import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlayListState {
    selectedGameStateId: string | null;
}

const initialState: PlayListState = {
    selectedGameStateId: null,
};

const playListSlice = createSlice({
    name: 'playList',
    initialState,
    reducers: {
        setSelectedGameState: (state, action: PayloadAction<string | null>) => {
            state.selectedGameStateId = action.payload;
        },
    },
});

export const { setSelectedGameState } = playListSlice.actions;

// Selectors
export const selectSelectedGameStateId = (state: any) => state.playList.selectedGameStateId;

export default playListSlice.reducer;

