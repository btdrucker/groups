import React from "react";
import {User} from "firebase/auth";
import styles from "./style.module.css";
import {useAppDispatch, useAppSelector} from "../../common/hooks";
import {signOutThunk} from "../auth/slice";
import {classes} from "../../common/classUtils";
import {AppMode, composeNewPuzzle, navigateToComposeList, navigateToPlayList, selectAppMode} from "./slice";

interface Props {
    user: User;
}

const WelcomeUser = ({ user }: Props) => {
    const dispatch = useAppDispatch();
    const appMode = useAppSelector(selectAppMode);

    const handleSignOut = async () => {
        dispatch(signOutThunk());
    };

    const handleMakePuzzles = () => {
        dispatch(navigateToComposeList());
    };

    const handlePlayPuzzles = () => {
        dispatch(navigateToPlayList());
    };

    const handleBack = () => {
        if (appMode === AppMode.Compose) {
            dispatch(navigateToComposeList());
        } else if (appMode === AppMode.Play) {
            dispatch(navigateToPlayList());
        }
    };
    const handleCreateNew = () => {
        dispatch(composeNewPuzzle());
    };


    const displayName = user.displayName || user.email || "User";

    // Determine which buttons to show based on current view
    const showMakePuzzlesButton = appMode === AppMode.PlayList;
    const showPlayPuzzlesButton = appMode === AppMode.ComposeList;
    const showCreateNewButton = appMode === AppMode.ComposeList;
    const showBackButton = appMode === AppMode.Compose || appMode === AppMode.Play;

    // Determine screen title
    let screenTitle = '';
    if (appMode === AppMode.ComposeList) {
        screenTitle = "Puzzles I've made";
    } else if (appMode === AppMode.Compose) {
        screenTitle = "Edit puzzle";
    } else if (appMode === AppMode.PlayList) {
        screenTitle = "Play puzzles";
    } else if (appMode === AppMode.Play) {
        screenTitle = "Playing puzzle";
    }

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
                <div className={styles.leftSection}>
                    {showBackButton && (
                        <button
                            className={styles.actionButton}
                            onClick={handleBack}
                        >
                            ← Back
                        </button>
                    )}
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
