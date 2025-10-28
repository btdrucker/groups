import React, { useState } from "react";
import styles from "./style.module.css";
import { classes } from "../../common/classUtils";
import { isValidEmail } from "../../common/utils";
import type { AuthMode } from "./AuthScreen";

interface ResetPasswordFormProps {
    onModeChange: (mode: AuthMode) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onModeChange }) => {
    const [email, setEmail] = useState("");

    const handleResetPassword = () => {
        if (isValidEmail(email)) {
            console.log("Password reset requested for:", email);
            // TODO: Implement actual password reset logic
        }
    };

    return (
        <>
            <h1>Reset Password</h1>
            <input
                className={classes(styles.authInput, (!email || isValidEmail(email)) ? '' : styles.inputError)}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
            />
            <button
                className={styles.authButton}
                disabled={!isValidEmail(email)}
                onClick={handleResetPassword}
            >
                Send reset link
            </button>
            <div className={styles.authLinks}>
                <button className={styles.linkButton} onClick={() => onModeChange('login')}>
                    Back to sign in
                </button>
            </div>
        </>
    );
};

export default ResetPasswordForm;

