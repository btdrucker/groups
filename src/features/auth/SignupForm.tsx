import React, {useState} from "react";
import styles from "./style.module.css";
import {classes} from "../../common/classUtils";
import {isValidEmail} from "../../common/utils";
import type { AuthMode } from "./AuthScreen";

interface Props {
    onModeChange: (mode: AuthMode) => void;
}

const SignupForm = ({onModeChange}: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const isFormValid = isValidEmail(email) && !!password && password === confirm;

    function handleSignup() {
        console.log("Sign up confirmed:", {signupEmail: email, signupPassword: password});
        //TODO: Implement actual signup logic
    }

    return (
        <>
            <h1>Sign Up</h1>
            <input
                className={classes(styles.authInput, (!email || isValidEmail(email)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value.trim())}
            />
            <input
                className={classes(styles.authInput, (!password && !!confirm) ? styles.inputError : '')}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value.trim())}
            />
            <input
                className={classes(styles.authInput, (password === confirm) ? '' : styles.inputError)}
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
            />
            <button
                className={styles.authButton}
                disabled={!isFormValid}
                onClick={handleSignup}
            >
                Create account
            </button>
            <div className={styles.authLinks}>
                <button
                    className={styles.linkButton}
                    onClick={() => onModeChange('login')}
                >
                    Back to sign in
                </button>
            </div>
        </>
    );
};

export default SignupForm;
