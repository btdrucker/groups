import React from "react";
import styles from "./style.module.css";
import LogoutButton from "../../common/LogoutButton";
import IconButton from "../../common/IconButton";

interface Props {
    handleBack: () => void;
}

const ComposeHeader = ({ handleBack }: Props) => {
    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContent}>
                <IconButton onClick={handleBack} icon="fa-arrow-left">Back</IconButton>
                <h2 className={styles.centeredTitle}>Making puzzle</h2>
                <LogoutButton />
            </div>
        </div>
    );
};

export default ComposeHeader;
