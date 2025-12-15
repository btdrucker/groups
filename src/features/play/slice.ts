import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../common/store';

interface PlayState {
    loading: boolean;
    error: string | null;
}

const initialState: PlayState = {
    loading: false,
    error: null,
};

const playSlice = createSlice({
    name: 'play',
    initialState,
    reducers: {
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setError } = playSlice.actions;
export const selectPlayLoading = (state: RootState): boolean => state.play.loading;
export const selectPlayError = (state: RootState): string | null => state.play.error;

export default playSlice.reducer;
