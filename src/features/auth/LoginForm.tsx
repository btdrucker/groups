import React, { useState } from "react";
import styles from "./style.module.css";
import { classes } from "../../common/classUtils";
import { isValidEmail } from "../../common/utils";
import { useAppDispatch, useAppSelector } from "../../common/hooks";
import {
    signInWithGoogleThunk,
    signInWithEmailThunk,
    setAuthMode,
    selectAuthLoading,
    selectAuthError
} from "./slice";

// Firebase authError values:
// auth/invalid-email - The email address is badly formatted
// auth/user-disabled - The user account has been disabled by an administrator
// auth/user-not-found - There is no user record corresponding to the email
// auth/wrong-password - The password is invalid for the given email
// auth/invalid-credential - The credential is malformed or has expired (newer error that can replace user-not-found/wrong-password)
// auth/too-many-requests - Access temporarily blocked due to too many failed login attempts
// auth/network-request-failed - A network error occurred (timeout, interrupted connection, unreachable host)
// auth/operation-not-allowed - Email/password accounts are not enabled in the Firebase Console
// auth/requires-recent-login - The user's credential is too old and requires re-authentication

const LoginForm = () => {
    const dispatch = useAppDispatch();
    const loading = useAppSelector(selectAuthLoading);
    const error = useAppSelector(selectAuthError);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const isFormValid = isValidEmail(email) && !!password;

    const handleGoogleLogin = async () => {
        dispatch(signInWithGoogleThunk());
    };

    const handleEmailLogin = async () => {
        dispatch(signInWithEmailThunk({ email, password }));
    };

    return (
        <>
            <h1>Sign In</h1>
            {error && <div className={styles.errorMessage}>{error}</div>}
            <button
                className={styles.authButton}
                onClick={handleGoogleLogin}
                disabled={loading}
            >
                {loading ? "Signing in..." : "Sign in with Google"}
            </button>
            <div className={styles.divider}>or</div>
            <input
                className={classes(styles.authInput, (!email || isValidEmail(email)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                disabled={loading}
            />
            <input
                className={styles.authInput}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                disabled={loading}
            />
            <button
                className={styles.authButton}
                disabled={!isFormValid || loading}
                onClick={handleEmailLogin}
            >
                {loading ? "Signing in..." : "Sign in"}
            </button>
            <div className={styles.authLinks}>
                <button
                    className={styles.linkButton}
                    onClick={() => dispatch(setAuthMode('signup'))}
                    disabled={loading}
                >
                    Create account
                </button>
                <button
                    className={styles.linkButton}
                    onClick={() => dispatch(setAuthMode('reset'))}
                    disabled={loading}
                >
                    Forgot password?
                </button>
            </div>
        </>
    );
};

export default LoginForm;

