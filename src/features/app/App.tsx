import React from "react";
import Composer from "../composer/Composer";
import AuthScreen from "../auth/AuthScreen";
import WelcomeUser from "./WelcomeUser";
import PuzzleList from "../puzzle-list/PuzzleList";
import Player from "../player/Player";
import PlayList from "../play-list/PlayList";
import {onAuthStateChange} from "../../firebase/auth";
import styles from "./style.module.css";
import { useAppDispatch, useAppSelector } from "../../common/hooks";
import { setUser, selectUser, selectAuthInitialized } from "../auth/slice";
import { selectCurrentView } from "./slice";

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
                    currentView === 'compose-list' ? (
                        <PuzzleList />
                    ) : currentView === 'composer' ? (
                        <Composer />
                    ) : currentView === 'player' ? (
                        <Player />
                    ) : (
                        <PlayList />
                    )
                ) : (
                    <AuthScreen/>
                )}
            </div>
        </div>
    )
}

export default App
