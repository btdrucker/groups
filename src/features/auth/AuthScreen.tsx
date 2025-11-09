import React from "react";
import styles from "./style.module.css";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { useAppSelector } from "../../common/hooks";
import { selectAuthMode, AuthMode } from "./slice";

const AuthScreen = () => {
    const mode = useAppSelector(selectAuthMode);

    return (
        <div className={styles.authScreenContainer}>
            <div className={styles.authBox}>
                {mode === AuthMode.LOGIN && (
                    <LoginForm />
                )}
                {mode === AuthMode.SIGNUP && (
                    <SignupForm />
                )}
                {mode === AuthMode.RESET && (
                    <ResetPasswordForm />
                )}
            </div>
        </div>
    );
};

export default AuthScreen;
