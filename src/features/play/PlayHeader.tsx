import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import commonStyles from "../../common/style.module.css";
import LogoutButton from "../auth/LogoutButton";

const PlayHeader: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate("/puzzles");
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContentCentered}>
                <button className={commonStyles.actionButton} onClick={handleBack}>
                    <i className="fa-solid fa-arrow-left"></i> <span className={commonStyles.hideOnMobile}>Back</span>
                </button>
                <h2 className={styles.centeredTitle}>Playing puzzle</h2>
                <LogoutButton />
            </div>
        </div>
    );
};

export default PlayHeader;
