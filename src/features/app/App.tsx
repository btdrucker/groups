import React from "react";
import Compose from "../compose/Compose";
import ComposeList from "../compose-list/ComposeList";
import Play from "../play/Play";
import PlayList from "../play-list/PlayList";
import Stats from "../stats/Stats";
import {onAuthStateChange} from "../../firebase/auth";
import styles from "./style.module.css";
import {useAppDispatch, useAppSelector} from "../../common/hooks";
import {selectAuthInitialized, selectUser, setUser} from "../auth/slice";
import AuthScreen from "../auth/AuthScreen";
import { Routes, Route, Navigate } from 'react-router-dom';

const App = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const initialized = useAppSelector(selectAuthInitialized);

    React.useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChange((currentUser) => {
            dispatch(setUser(currentUser));
        });
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [dispatch]);

    if (!initialized) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.appContainer}>
            {user ? (
                <>
                    <Routes>
                        <Route path="/" element={<Navigate to="/compose-list" replace />} />
                        <Route path="/compose-list" element={<ComposeList />} />
                        <Route path="/compose" element={<Compose />} />
                        <Route path="/compose/:puzzleId" element={<Compose />} />
                        <Route path="/stats/:puzzleId" element={<Stats />} />
                        <Route path="/play-list" element={<PlayList />} />
                        <Route path="/play/:puzzleId" element={<Play />} />
                        <Route path="*" element={<Navigate to="/play-list" replace />} />
                    </Routes>
                </>
            ) : (
                <AuthScreen/>
            )}
        </div>
    )
}

export default App
