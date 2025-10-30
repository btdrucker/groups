import React from "react";
import Composer2 from "../features/composer/Composer2";
import AuthScreen from "../features/auth/AuthScreen";
import WelcomeUser from "../features/auth/WelcomeUser";
import PuzzleList from "../features/puzzles/PuzzleList";
import {onAuthStateChange} from "../firebase/auth";
import {User} from "firebase/auth";
import styles from "./style.module.css";
import { handleSavePuzzle as savePuzzleToFirestore, updatePuzzle, Puzzle } from "../firebase/firestore";

type View = 'list' | 'composer';

const App = () => {
    const [user, setUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [currentView, setCurrentView] = React.useState<View>('list');
    const [reloadKey, setReloadKey] = React.useState(0);
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

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleCreateNew = () => {
        setSelectedPuzzle(undefined); // Clear previous puzzle
        setCurrentView('composer');
    };

    async function handleSavePuzzle(puzzle: Puzzle) {
        if (!user) return;
        if (!puzzle.id) {
            // New puzzle: remove id, creatorId, createdAt
            const { id, creatorId, createdAt, ...puzzleData } = puzzle;
            await savePuzzleToFirestore(puzzleData, user.uid);
        } else {
            // Existing puzzle: update by id
            await updatePuzzle(puzzle.id, puzzle);
        }
        setReloadKey((k) => k + 1);
        setCurrentView('list');
    }

    const handleBackToList = () => {
        setCurrentView('list');
    };

    function handleRefresh() {
        setReloadKey((k) => k + 1);
    }

    const handleSelectPuzzle = (puzzle: Puzzle) => {
        setSelectedPuzzle(puzzle);
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
