import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from 'firebase/auth';
import {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut as firebaseSignOut,
    resetPassword as firebaseResetPassword,
    onAuthStateChange
} from '../../firebase/auth';
import { RootState } from '../../common/store';

export type AuthMode = 'login' | 'signup' | 'reset';

interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
    authMode: AuthMode;
    initialized: boolean;
}

const initialState: AuthState = {
    user: null,
    loading: false,
    error: null,
    authMode: 'login',
    initialized: false,
};

// Async thunks
export const signInWithGoogleThunk = createAsyncThunk(
    'auth/signInWithGoogle',
    async (_, { rejectWithValue }) => {
        const { user, error } = await signInWithGoogle();
        if (error) {
            return rejectWithValue(error);
        }
        return user;
    }
);

export const signInWithEmailThunk = createAsyncThunk(
    'auth/signInWithEmail',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        const { user, error } = await signInWithEmail(email, password);
        if (error) {
            return rejectWithValue(error);
        }
        return user;
    }
);

export const signUpWithEmailThunk = createAsyncThunk(
    'auth/signUpWithEmail',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        const { user, error } = await signUpWithEmail(email, password);
        if (error) {
            return rejectWithValue(error);
        }
        return user;
    }
);

export const signOutThunk = createAsyncThunk(
    'auth/signOut',
    async (_, { rejectWithValue }) => {
        const { error } = await firebaseSignOut();
        if (error) {
            return rejectWithValue(error);
        }
        return null;
    }
);

export const resetPasswordThunk = createAsyncThunk(
    'auth/resetPassword',
    async (email: string, { rejectWithValue }) => {
        const { error } = await firebaseResetPassword(email);
        if (error) {
            return rejectWithValue(error);
        }
        return email;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
            state.initialized = true;
        },
        setAuthMode: (state, action: PayloadAction<AuthMode>) => {
            state.authMode = action.payload;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Sign in with Google
        builder.addCase(signInWithGoogleThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(signInWithGoogleThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        });
        builder.addCase(signInWithGoogleThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Sign in with email
        builder.addCase(signInWithEmailThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(signInWithEmailThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        });
        builder.addCase(signInWithEmailThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Sign up with email
        builder.addCase(signUpWithEmailThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(signUpWithEmailThunk.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        });
        builder.addCase(signUpWithEmailThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Sign out
        builder.addCase(signOutThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(signOutThunk.fulfilled, (state) => {
            state.loading = false;
            state.user = null;
        });
        builder.addCase(signOutThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Reset password
        builder.addCase(resetPasswordThunk.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(resetPasswordThunk.fulfilled, (state) => {
            state.loading = false;
        });
        builder.addCase(resetPasswordThunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { setUser, setAuthMode, clearError } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthMode = (state: RootState) => state.auth.authMode;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;

export default authSlice.reducer;

