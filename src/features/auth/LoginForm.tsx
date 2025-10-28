import React from "react";
import styles from "./style.module.css";

interface LoginFormProps {
    onModeChange: (mode: 'signup' | 'reset') => void;
}

const LoginForm: React.FC<LoginFormProps> = ({onModeChange}) => {
    return (
        <>
            <button className={styles.authButton}>Sign in with Google</button>
            <div className={styles.divider}>or</div>
            <input className={styles.authInput} type="email" placeholder="Email"/>
            <input className={styles.authInput} type="password" placeholder="Password"/>
            <button className={styles.authButton}>Sign in</button>
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

