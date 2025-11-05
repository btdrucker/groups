import React from "react";
import { User } from "firebase/auth";
import styles from "./style.module.css";
import { useAppDispatch } from "../../common/hooks";
import { signOutThunk } from "../auth/slice";
import {classes} from "../../common/classUtils";

interface Props {
    user: User;
}

const WelcomeUser = ({ user }: Props) => {
    const dispatch = useAppDispatch();

    const handleSignOut = async () => {
        dispatch(signOutThunk());
    };

    const displayName = user.displayName || user.email || "User";

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
                <span className={styles.welcomeText}>
                    Welcome, {displayName}!
                </span>
                <button
                    className={classes(styles.actionButton, styles.logout)}
                    onClick={handleSignOut}
                >
                    Log out
                </button>
            </div>
        </div>
    );
};

export default WelcomeUser;
