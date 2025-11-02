import React from "react";
import Composer from "../features/composer/Composer";
import AuthScreen from "../features/auth/AuthScreen";
import WelcomeUser from "../features/auth/WelcomeUser";
import PuzzleList from "../features/puzzles/PuzzleList";
import PuzzlePlayer from "../features/puzzles/PuzzlePlayer";
import {onAuthStateChange} from "../firebase/auth";
import styles from "./style.module.css";
import { useAppDispatch, useAppSelector } from "./hooks";
import { setUser, selectUser, selectAuthInitialized } from "../features/auth/slice";
import { selectCurrentView } from "../features/app/slice";

const App = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const currentView = useAppSelector(selectCurrentView);
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
            {user && <WelcomeUser user={user}/>}
            <div className={styles.mainContent}>
                {user ? (
                    currentView === 'list' ? (
                        <PuzzleList />
                    ) : currentView === 'composer' ? (
                        <Composer />
                    ) : (
                        <PuzzlePlayer />
                    )
                ) : (
                    <AuthScreen/>
                )}
            </div>
        </div>
    )
}

export default App
