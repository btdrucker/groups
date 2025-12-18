import {combineReducers, configureStore} from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import logger from 'redux-logger'
import composeReducer from '../features/compose/slice'
import authReducer from '../features/auth/slice'
import composeListReducer from '../features/compose-list/slice'
import playListReducer from '../features/play-list/slice'

const rootReducer = combineReducers({
    auth: authReducer,
    composeList: composeListReducer,
    compose: composeReducer,
    playList: playListReducer,
})

// Persist configuration - cache lists to avoid redundant Firestore reads
const persistConfig = {
    key: 'root',
    storage,
    version: 2,
    // Persist lists to reduce Firestore reads and improve load times
    // Persist compose to prevent loss of work-in-progress on accidental refresh
    whitelist: ['composeList', 'playList', 'compose'],
    migrate: (state: any) => {
        // Migration for version 2: Convert old gameStates array to gameStatesWithPuzzles
        if (state && state.playList) {
            // If old structure exists (gameStates array), convert to new structure
            if (state.playList.gameStates && !state.playList.gameStatesWithPuzzles) {
                state.playList.gameStatesWithPuzzles = state.playList.gameStates.map((gameState: any) => ({
                    gameState,
                    puzzle: null
                }));
                delete state.playList.gameStates;
            }
        }
        return Promise.resolve(state);
    }
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // Ignore these actions because they contain non-serializable values that are converted in reducers
            ignoredActions: [
                'persist/PERSIST',
                'persist/REHYDRATE',
                'auth/setUser', // Firebase User is converted to SerializableUser in the reducer
            ],
        }
    }).concat(logger)
})

export default store

export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
