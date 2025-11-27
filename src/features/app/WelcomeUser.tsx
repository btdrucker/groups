import React from "react";
import {User} from "firebase/auth";
import styles from "./style.module.css";
import {useAppDispatch} from "../../common/hooks";
import {signOutThunk} from "../auth/slice";
import {classes} from "../../common/classUtils";
import {composeNewPuzzle} from "../compose/slice";
import { useNavigate, useLocation } from "react-router-dom";

interface Props {
    user: User;
}

const WelcomeUser = ({ user }: Props) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        dispatch(signOutThunk());
        navigate('/');
    };

    const handleMakePuzzles = () => {
        navigate('/');
    };

    const handlePlayPuzzles = () => {
        navigate('/puzzles');
    };

    const handleBack = () => {
        if (location.pathname.startsWith('/compose')) {
            navigate('/');
        } else if (location.pathname.startsWith('/play')) {
            navigate('/puzzles');
        }
    };

    const handleCreateNew = () => {
        dispatch(composeNewPuzzle());
        navigate('/compose');
    };

    const displayName = user.displayName || user.email || "User";

    // Determine which buttons to show based on current route
    const isComposeList = location.pathname === '/';
    const isCompose = location.pathname === '/compose';
    const isPlayList = location.pathname === '/puzzles';
    const isPlay = location.pathname.startsWith('/play/');

    const showMakePuzzlesButton = isPlayList;
    const showPlayPuzzlesButton = isComposeList;
    const showCreateNewButton = isComposeList;
    const showBackButton = isCompose || isPlay;

    // Determine screen title
    let screenTitle = '';
    if (isPlayList) {
        screenTitle = `Welcome, ${displayName} -- Play Puzzles!`;
    } else if (isComposeList) {
        screenTitle = `Welcome, ${displayName} -- Make Puzzles!`;
    } else if (isCompose) {
        screenTitle = 'Making puzzle';
    } else if (isPlay) {
        screenTitle = 'Playing puzzle';
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
                    {/* Show only the combined title for play list and puzzle list */}
                    {(isPlayList || isComposeList) && screenTitle && (
                        <h2 className={styles.screenTitle}>{screenTitle}</h2>
                    )}
                    {/* For other screens, show the previous logic */}
                    {!(isPlayList || isComposeList) && !(isCompose || isPlay) && (
                        <span className={styles.welcomeText}>
                            Welcome, {displayName}!
                        </span>
                    )}
                    {!(isPlayList || isComposeList) && screenTitle && (
                        <h2 className={styles.centeredTitle}>{screenTitle}</h2>
                    )}
                </div>
                <div className={styles.buttonGroup}>
                    {showCreateNewButton && (
                        <button
                            className={styles.actionButton}
                            onClick={handleCreateNew}
                        >
                            Make a new Puzzle
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
