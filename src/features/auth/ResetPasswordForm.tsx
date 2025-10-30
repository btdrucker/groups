import React, { useState } from "react";
import styles from "./style.module.css";
import { classes } from "../../common/classUtils";
import { isValidEmail } from "../../common/utils";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    resetPasswordThunk,
    setAuthMode,
    selectAuthLoading,
    selectAuthError
} from "./slice";

const ResetPasswordForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const loading = useAppSelector(selectAuthLoading);
    const error = useAppSelector(selectAuthError);

    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async () => {
        if (isValidEmail(email)) {
            setSuccess(false);
            const result = await dispatch(resetPasswordThunk(email));
            if (resetPasswordThunk.fulfilled.match(result)) {
                setSuccess(true);
            }
        }
    };

    return (
        <>
            <h1>Reset Password</h1>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>Password reset link sent! Check your email.</div>}
            <input
                className={classes(styles.authInput, (!email || isValidEmail(email)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                disabled={loading}
            />
            <button
                className={styles.authButton}
                disabled={!isValidEmail(email) || loading}
                onClick={handleResetPassword}
            >
                {loading ? "Sending..." : "Send reset link"}
            </button>
            <div className={styles.authLinks}>
                <button
                    className={styles.linkButton}
                    onClick={() => dispatch(setAuthMode('login'))}
                    disabled={loading}
                >
                    Back to sign in
                </button>
            </div>
        </>
    );
};

export default ResetPasswordForm;

