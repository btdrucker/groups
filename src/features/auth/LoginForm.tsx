import React, { useState } from "react";
import styles from "./style.module.css";
import type { AuthMode } from "./AuthScreen";
import { classes } from "../../common/classUtils";
import { isValidEmail } from "../../common/utils";

interface Props {
    onModeChange: (mode: AuthMode) => void;
}

const LoginForm = ({onModeChange}: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const isFormValid = isValidEmail(email) && !!password;

    const handleGoogleLogin = () => {
        console.log("Google login confirmed");
        //TODO: Implement actual login logic
    };

    const handleEmailLogin = () => {
        console.log("Email login confirmed:", { email, password });
        //TODO: Implement actual login logic
    };

    return (
        <>
            <h1>Sign In</h1>
            <button
                className={styles.authButton}
                onClick={handleGoogleLogin}
            >
                Sign in with Google
            </button>
            <div className={styles.divider}>or</div>
            <input
                className={classes(styles.authInput, (!email || isValidEmail(email)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
            />
            <input
                className={styles.authInput}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
            />
            <button
                className={styles.authButton}
                disabled={!isFormValid}
                onClick={handleEmailLogin}
            >
                Sign in
            </button>
            <div className={styles.authLinks}>
                <button
                    className={styles.linkButton}
                    onClick={() => onModeChange('signup')}
                >
                    Create account
                </button>
                <button
                    className={styles.linkButton}
                    onClick={() => onModeChange('reset')}
                >
                    Forgot password?
                </button>
            </div>
        </>
    );
};

export default LoginForm;

