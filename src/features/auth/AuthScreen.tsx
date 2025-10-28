import React, { useState } from "react";
import styles from "./style.module.css";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ResetPasswordForm from "./ResetPasswordForm";

export type AuthMode = 'login' | 'signup' | 'reset';

const AuthScreen = () => {
    const [mode, setMode] = useState<AuthMode>('login');

    return (
        <div className={styles.authScreenContainer}>
            <div className={styles.authBox}>
                {mode === 'login' && (
                    <LoginForm onModeChange={setMode} />
                )}
                {mode === 'signup' && (
                    <SignupForm onModeChange={setMode} />
                )}
                {mode === 'reset' && (
                    <ResetPasswordForm onModeChange={setMode} />
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
