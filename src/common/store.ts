import {combineReducers, configureStore} from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import logger from 'redux-logger'
import composeReducer from '../features/compose/slice'
import authReducer from '../features/auth/slice'
import composeListReducer from '../features/compose-list/slice'
import appReducer from '../features/app/slice'
import playListReducer from '../features/play-list/slice'

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['compose'], // Only persist compose state
}

const rootReducer = combineReducers({
    app: appReducer,
    auth: authReducer,
    composeList: composeListReducer,
    compose: composeReducer,
    playList: playListReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            ignoredPaths: ['auth.user'], // Firebase User objects are not serializable
        }
    }).concat(logger)
})

export default store

export const persistor = persistStore(store)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
