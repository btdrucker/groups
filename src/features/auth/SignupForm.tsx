import React, {useState} from "react";
import styles from "./style.module.css";
import {classes} from "../../common/classUtils";
import {isValidEmail} from "../../common/utils";
import type { AuthMode } from "./AuthScreen";
import { signUpWithEmail } from "../../firebase/auth";

interface Props {
    onModeChange: (mode: AuthMode) => void;
}

const SignupForm = ({onModeChange}: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const isFormValid = isValidEmail(email) && !!password && password === confirm;

    async function handleSignup() {
        setLoading(true);
        setError("");
        const { user, error: authError } = await signUpWithEmail(email, password);
        if (authError) {
            setError(authError);
        } else if (user) {
            console.log("Sign up successful:", user.email);
        }
        setLoading(false);
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
            <button
                className={styles.authButton}
                disabled={!isFormValid || loading}
                onClick={handleSignup}
            >
                {loading ? "Creating account..." : "Create account"}
            </button>
            <div className={styles.authLinks}>
                <button
                    className={styles.linkButton}
                    onClick={() => onModeChange('login')}
                    disabled={loading}
                >
                    Back to sign in
                </button>
            </div>
        </>
    );
};

export default SignupForm;
