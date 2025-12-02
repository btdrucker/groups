import React from "react";
import styles from "./style.module.css";
import commonStyles from "../../common/style.module.css";
import LogoutButton from "../auth/LogoutButton";

interface ComposeHeaderProps {
    handleBack: () => void;
}

const ComposeHeader: React.FC<ComposeHeaderProps> = ({ handleBack }) => {
    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContentCentered}>
                <button className={commonStyles.actionButton} onClick={handleBack}>
                    <i className="fa-solid fa-arrow-left"></i> <span className={commonStyles.hideOnMobile}>Back</span>
                </button>
                <h2 className={styles.centeredTitle}>Making puzzle</h2>
                <LogoutButton />
            </div>
        </div>
    );
};

export default ComposeHeader;
