import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../common/hooks";
import { selectUser } from "../auth/slice";
import LogoutButton from "../auth/LogoutButton";
import styles from "./style.module.css";
import commonStyles from "../../common/style.module.css";

const PlayListHeader: React.FC = () => {
    const navigate = useNavigate();
    const user = useAppSelector(selectUser);
    const displayName = user?.displayName || user?.email || "User";

    const handleMakePuzzles = () => {
        navigate("/");
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContent}>
                <h2 className={styles.screenTitle}>{`Welcome, ${displayName} -- Play Puzzles!`}</h2>
                <div className={styles.buttonGroup}>
                    <button className={commonStyles.actionButton} onClick={handleMakePuzzles}>
                        <span className={commonStyles.hideOnMobile}>Make puzzles</span> <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
};

export default PlayListHeader;
