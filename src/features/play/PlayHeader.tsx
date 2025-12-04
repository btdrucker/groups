import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import LogoutButton from "../../common/LogoutButton";
import IconButton from "../../common/IconButton";

const PlayHeader: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate("/puzzles");
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContent}>
                <IconButton onClick={handleBack} icon="fa-arrow-left">Back</IconButton>
                <h2 className={styles.centeredTitle}>Playing puzzle</h2>
                <LogoutButton />
            </div>
        </div>
    );
};

export default PlayHeader;
