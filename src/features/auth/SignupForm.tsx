import React, {useState} from "react";
import styles from "./style.module.css";
import {classes} from "../../common/classUtils";
import {isValidEmail} from "../../common/utils";

interface Props {
    onModeChange: (mode: 'login') => void;
}

const SignupForm = ({onModeChange}: Props) => {
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupConfirm, setSignupConfirm] = useState("");
    const isFormValid = isValidEmail(signupEmail) && !!signupPassword && signupPassword === signupConfirm;

    function handleSignup() {
        // Debug confirmation
        console.log("Sign up confirmed:", {signupEmail, signupPassword});
    }

    return (
        <>
            <input
                className={classes(styles.authInput, (!signupEmail || isValidEmail(signupEmail)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value.trim())}
            />
            <input
                className={classes(styles.authInput, (!signupPassword && !!signupConfirm) ? styles.inputError : '')}
                type="password"
                placeholder="Password"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value.trim())}
            />
            <input
                className={classes(styles.authInput, (signupPassword === signupConfirm) ? '' : styles.inputError)}
                type="password"
                placeholder="Confirm Password"
                value={signupConfirm}
                onChange={e => setSignupConfirm(e.target.value)}
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
