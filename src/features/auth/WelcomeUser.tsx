import React from "react";
import { User } from "firebase/auth";
import { signOut } from "../../firebase/auth";
import styles from "./style.module.css";

interface Props {
    user: User;
}

const WelcomeUser = ({ user }: Props) => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const handleSignOut = async () => {
        setLoading(true);
        setError("");
        const { error: authError } = await signOut();
        if (authError) {
            setError(authError);
        }
        setLoading(false);
    };

    const displayName = user.displayName || user.email || "User";

    return (
        <div className={styles.welcomeContainer}>
            <div className={styles.welcomeContent}>
                <span className={styles.welcomeText}>
                    Welcome, {displayName}!
                </span>
                {error && <div className={styles.errorMessage}>{error}</div>}
                <button
                    className={styles.logoutButton}
                    onClick={handleSignOut}
                    disabled={loading}
                >
                    {loading ? "Signing out..." : "Logout"}
                </button>
            </div>
        </div>
    );
};

export default WelcomeUser;

