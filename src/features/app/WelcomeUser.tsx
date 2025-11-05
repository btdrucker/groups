import React from "react";
import { User } from "firebase/auth";
import styles from "./style.module.css";
import { useAppDispatch, useAppSelector } from "../../common/hooks";
import { signOutThunk } from "../auth/slice";
import { classes } from "../../common/classUtils";
import { navigateToList, navigateToPlayList, navigateToComposer, selectCurrentView } from "./slice";
import { clearSelectedPuzzle } from "../puzzle-list/slice";

interface Props {
    user: User;
}

const WelcomeUser = ({ user }: Props) => {
    const dispatch = useAppDispatch();
    const currentView = useAppSelector(selectCurrentView);

    const handleSignOut = async () => {
        dispatch(signOutThunk());
    };

    const handleMakePuzzles = () => {
        if (currentView !== 'compose-list') {
            dispatch(navigateToList());
        }
    };

    const handlePlayPuzzles = () => {
        if (currentView !== 'play-list') {
            dispatch(navigateToPlayList());
        }
    };

    const handleBack = () => {
        if (currentView === 'composer') {
            dispatch(navigateToList());
        } else if (currentView === 'player') {
            dispatch(navigateToPlayList());
        }
    };
    const handleCreateNew = () => {
        dispatch(clearSelectedPuzzle());
        dispatch(navigateToComposer());
    };


    const displayName = user.displayName || user.email || "User";

    // Determine which buttons to show based on current view
    const showMakePuzzlesButton = currentView !== 'compose-list' && currentView !== 'composer' && currentView !== 'player';
    const showPlayPuzzlesButton = currentView !== 'play-list' && currentView !== 'player' && currentView !== 'composer';
    const showCreateNewButton = currentView === 'compose-list';
    const showBackButton = currentView === 'composer' || currentView === 'player';

    // Determine screen title
    let screenTitle = '';
    if (currentView === 'compose-list') {
        screenTitle = "Puzzles I've made";
    } else if (currentView === 'composer') {
        screenTitle = "Edit puzzle";
    } else if (currentView === 'play-list' || currentView === 'player') {
        screenTitle = "Play puzzles";
    }

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
                <div className={styles.leftSection}>
                    <span className={styles.welcomeText}>
                        Welcome, {displayName}!
                    </span>
                    {screenTitle && (
                        <h2 className={styles.screenTitle}>{screenTitle}</h2>
                    )}
                </div>
                <div className={styles.buttonGroup}>
                    {showCreateNewButton && (
                        <button
                            className={styles.actionButton}
                            onClick={handleCreateNew}
                        >
                            Create new puzzle
                        </button>
                    )}
                    {showMakePuzzlesButton && (
                        <button
                            className={styles.actionButton}
                            onClick={handleMakePuzzles}
                        >
                            Make puzzles
                        </button>
                    )}
                    {showPlayPuzzlesButton && (
                        <button
                            className={styles.actionButton}
                            onClick={handlePlayPuzzles}
                        >
                            Play puzzles
                        </button>
                    )}
                    {showBackButton && (
                        <button
                            className={styles.actionButton}
                            onClick={handleBack}
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        className={classes(styles.actionButton, styles.logout)}
                        onClick={handleSignOut}
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeUser;
