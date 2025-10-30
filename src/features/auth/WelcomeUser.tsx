import React from "react";
import { User } from "firebase/auth";
import styles from "./style.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { signOutThunk, selectAuthLoading, selectAuthError } from "./slice";

interface Props {
    user: User;
}

const WelcomeUser = ({ user }: Props) => {
    const dispatch = useAppDispatch();
    const loading = useAppSelector(selectAuthLoading);
    const error = useAppSelector(selectAuthError);

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
                {error && <div className={styles.errorMessage}>{error}</div>}
                <button
                    className={styles.logoutButton}
                    onClick={handleSignOut}
                    disabled={loading}
                >
                    {loading ? "Signing out..." : "Logout"}
                </button>
            </div>
        </div>
    );
};

export default WelcomeUser;

