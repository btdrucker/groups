import React from "react";
import Composer from "../features/composer/Composer";
import AuthScreen from "../features/auth/AuthScreen";
import WelcomeUser from "../features/auth/WelcomeUser";
import PuzzleList from "../features/puzzles/PuzzleList";
import {onAuthStateChange} from "../firebase/auth";
import {User} from "firebase/auth";
import styles from "./style.module.css";

type View = 'list' | 'composer';

const App = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currentView, setCurrentView] = React.useState<View>('list');

    React.useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // const dispatch = useAppDispatch();
    // dispatch({type: "RESET_STATE"})

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleCreateNew = () => {
        setCurrentView('composer');
    };

    const handleBackToList = () => {
        setCurrentView('list');
    };

    return (
        <div className={styles.appContainer}>
            {user && <WelcomeUser user={user}/>}
            <div className={styles.mainContent}>
                {user ? (
                    currentView === 'list' ? (
                        <PuzzleList
                            user={user}
                            onCreateNew={handleCreateNew}
                        />
                    ) : (
                        <Composer onBack={handleBackToList}/>
                    )
                ) : (
                    <AuthScreen/>
                )}
            </div>
        </div>
    )
}

export default App
