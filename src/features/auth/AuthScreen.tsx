import React from "react";
import styles from "./style.module.css";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { useAppSelector } from "../../app/hooks";
import { selectAuthMode } from "./slice";

const AuthScreen = () => {
    const mode = useAppSelector(selectAuthMode);

    return (
        <div className={styles.authScreenContainer}>
            <div className={styles.authBox}>
                {mode === 'login' && (
                    <LoginForm />
                )}
                {mode === 'signup' && (
                    <SignupForm />
                )}
                {mode === 'reset' && (
                    <ResetPasswordForm />
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
