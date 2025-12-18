import React, {useState} from "react";
import styles from "./style.module.css";
import {classes} from "../../common/utils";
import {isValidEmail} from "../../common/utils";
import {useAppDispatch, useAppSelector} from "../../common/hooks";
import {AuthMode, selectAuthError, selectAuthLoading, setAuthMode, signUpWithEmailThunk} from "./slice";

const SignupForm = () => {
    const dispatch = useAppDispatch();
    const loading = useAppSelector(selectAuthLoading);
    const error = useAppSelector(selectAuthError);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [displayName, setDisplayName] = useState("");
    const isFormValid = isValidEmail(email) && !!password && password === confirm && !!displayName.trim();

    async function handleSignup() {
        dispatch(signUpWithEmailThunk({ email, password, displayName: displayName.trim() }));
    }

    return (
        <>
            <h1>Sign Up</h1>
            {error && <div className={styles.errorMessage}>{error}</div>}
            <input
                className={classes(styles.authInput, (!email || isValidEmail(email)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value.trim())}
                disabled={loading}
            />
            <input
                className={classes(styles.authInput, (!password && !!confirm) ? styles.inputError : '')}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value.trim())}
                disabled={loading}
            />
            <input
                className={classes(styles.authInput, (password === confirm) ? '' : styles.inputError)}
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                disabled={loading}
            />
            <input
                className={classes(styles.authInput)}
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                disabled={loading}
            />
            <button
                className={styles.actionButton}
                disabled={!isFormValid || loading}
                onClick={handleSignup}
            >
                {loading ? "Creating account..." : "Create account"}
            </button>
            <div className={styles.authLinks}>
                <button
                    className={styles.linkButton}
                    onClick={() => dispatch(setAuthMode(AuthMode.LOGIN))}
                    disabled={loading}
                >
                    Back to sign in
                </button>
            </div>
        </>
    );
};

export default SignupForm;
