import React, { useState } from "react";
import styles from "./style.module.css";
import { classes } from "../../common/classUtils";
import { isValidEmail } from "../../common/utils";
import type { AuthMode } from "./AuthScreen";
import { resetPassword } from "../../firebase/auth";

interface ResetPasswordFormProps {
    onModeChange: (mode: AuthMode) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onModeChange }) => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (isValidEmail(email)) {
            setLoading(true);
            setError("");
            setSuccess(false);
            const { success: resetSuccess, error: authError } = await resetPassword(email);
            if (authError) {
                setError(authError);
            } else if (resetSuccess) {
                setSuccess(true);
            }
            setLoading(false);
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
                    onClick={() => onModeChange('login')}
                    disabled={loading}
                >
                    Back to sign in
                </button>
            </div>
        </>
    );
};

export default ResetPasswordForm;

