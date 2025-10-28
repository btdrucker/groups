import React, { useState } from "react";
import styles from "./style.module.css";
import type { AuthMode } from "./AuthScreen";
import { classes } from "../../common/classUtils";
import { isValidEmail } from "../../common/utils";
import { signInWithGoogle, signInWithEmail } from "../../firebase/auth";

interface Props {
    onModeChange: (mode: AuthMode) => void;
}

const LoginForm = ({onModeChange}: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const isFormValid = isValidEmail(email) && !!password;

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        const { user, error: authError } = await signInWithGoogle();
        if (authError) {
            setError(authError);
        } else if (user) {
            console.log("Google login successful:", user.email);
        }
        setLoading(false);
    };

    const handleEmailLogin = async () => {
        setLoading(true);
        setError("");
        const { user, error: authError } = await signInWithEmail(email, password);
        if (authError) {
            setError(authError);
        } else if (user) {
            console.log("Email login successful:", user.email);
        }
        setLoading(false);
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
                    onClick={() => onModeChange('signup')}
                    disabled={loading}
                >
                    Create account
                </button>
                <button
                    className={styles.linkButton}
                    onClick={() => onModeChange('reset')}
                    disabled={loading}
                >
                    Forgot password?
                </button>
            </div>
        </>
    );
};

export default LoginForm;

