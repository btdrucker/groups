import React, { useState } from "react";
import styles from "./style.module.css";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const AuthScreen = () => {
    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
    // Sign Up state
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupConfirm, setSignupConfirm] = useState("");
    const [signupEmailError, setSignupEmailError] = useState("");
    const [signupConfirmError, setSignupConfirmError] = useState("");
    const allFilled = !!signupEmail.trim() && !!signupPassword.trim() && !!signupConfirm.trim();

    function handleSignup() {
        let valid = true;
        setSignupEmailError("");
        setSignupConfirmError("");
        if (!validateEmail(signupEmail)) {
            setSignupEmailError("Please enter a valid email address.");
            valid = false;
        }
        if (signupPassword !== signupConfirm) {
            setSignupConfirmError("Passwords do not match.");
            valid = false;
        }
        if (valid) {
            // Debug confirmation
            console.log("Sign up confirmed:", { signupEmail, signupPassword });
        }
    }

    return (
        <div className={styles.authScreenContainer}>
            <div className={styles.authBox}>
                <h1>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}</h1>
                {mode === 'login' && (
                    <LoginForm onModeChange={setMode} />
                )}
                {mode === 'signup' && (
                    <SignupForm onModeChange={setMode} />
                )}
                {mode === 'reset' && (
                    <>
                        <input className={styles.authInput} type="email" placeholder="Email" />
                        <button className={styles.authButton}>Send reset link</button>
                        <div className={styles.authLinks}>
                            <button className={styles.linkButton} onClick={() => setMode('login')}>Back to sign in</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
