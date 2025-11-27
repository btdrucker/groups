import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../common/hooks";
import { selectUser } from "../auth/slice";
import styles from "./style.module.css";
import commonStyles from "../../common/style.module.css";
import LogoutButton from "../auth/LogoutButton";

const ComposeListHeader: React.FC = () => {
    const navigate = useNavigate();
    const user = useAppSelector(selectUser);
    const displayName = user?.displayName || user?.email || "User";

    const handlePlayPuzzles = () => {
        navigate("/puzzles");
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContent}>
                <h2 className={styles.screenTitle}>{`Welcome, ${displayName} -- Make Puzzles!`}</h2>
                <div className={styles.buttonGroup}>
                    <button className={commonStyles.actionButton} onClick={handlePlayPuzzles}>
                        Play puzzles
                    </button>
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
};

export default ComposeListHeader;
