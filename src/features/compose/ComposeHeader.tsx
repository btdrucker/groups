import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import commonStyles from "../../common/style.module.css";
import LogoutButton from "../auth/LogoutButton";

const ComposeHeader: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate("/");
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContentCentered}>
                <button className={commonStyles.actionButton} onClick={handleBack}>
                    ← Back
                </button>
                <h2 className={styles.centeredTitle}>Making puzzle</h2>
                <LogoutButton />
            </div>
        </div>
    );
};

export default ComposeHeader;
