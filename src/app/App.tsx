import React from "react";
import Composer from "../features/composer/Composer";
import AuthScreen from "../features/auth/AuthScreen";
import WelcomeUser from "../features/auth/WelcomeUser";
import PuzzleList from "../features/puzzles/PuzzleList";
import {onAuthStateChange} from "../firebase/auth";
import {User} from "firebase/auth";
import styles from "./style.module.css";
import Composer2, {Puzzle} from "../features/composer/Composer2";

type View = 'list' | 'composer';

const App = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currentView, setCurrentView] = React.useState<View>('list');
    const [reloadKey, setReloadKey] = React.useState(0);
    const [hasLoadedList, setHasLoadedList] = React.useState(false);
    const [pendingReload, setPendingReload] = React.useState(false);
    const [selectedPuzzle, setSelectedPuzzle] = React.useState<Puzzle | undefined>(undefined);

    React.useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Track when the list is loaded
    React.useEffect(() => {
        if (currentView === 'list' && !hasLoadedList) {
            setReloadKey((k) => k + 1);
            setHasLoadedList(true);
        }
        if (currentView === 'list' && pendingReload) {
            setReloadKey((k) => k + 1);
            setPendingReload(false);
        }
    }, [currentView, hasLoadedList, pendingReload]);

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleCreateNew = () => {
        setCurrentView('composer');
        setPendingReload(true);
    };

    const handleBackToList = () => {
        setCurrentView('list');
    };

    function handleSavePuzzle(puzzle: Puzzle) {
        // After saving, trigger reload on next list view
        setPendingReload(true);
        setCurrentView('list');
        console.log(puzzle);
    }

    function handleRefresh() {
        setReloadKey((k) => k + 1);
        setHasLoadedList(true);
    }

    const handleSelectPuzzle = (puzzle: import("../firebase/firestore").Puzzle) => {
        // Convert to Composer2 format
        const composerPuzzle: import("../features/composer/Composer2").Puzzle = {
            categories: puzzle.categories.map((name, i) => ({
                name,
                words: puzzle.words.slice(i * 4, i * 4 + 4)
            }))
        };
        setSelectedPuzzle(composerPuzzle);
        setCurrentView('composer');
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
                            reloadKey={reloadKey}
                            onRefresh={handleRefresh}
                            onSelectPuzzle={handleSelectPuzzle}
                        />
                    ) : (
                        <Composer2
                            initialPuzzle={selectedPuzzle}
                            onSave={handleSavePuzzle}
                            onBack={handleBackToList}
                        />
                    )
                ) : (
                    <AuthScreen/>
                )}
            </div>
        </div>
    )
}

export default App
