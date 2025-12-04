import React from "react";
import {useNavigate} from "react-router-dom";
import {useAppSelector} from "../../common/hooks";
import {selectUser} from "../auth/slice";
import styles from "./style.module.css";
import LogoutButton from "../../common/LogoutButton";
import IconButton from "../../common/IconButton";

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
                <IconButton onClick={handlePlayPuzzles} icon="fa-puzzle-piece">Play puzzles</IconButton>
                <h2 className={styles.screenTitle}>Make Puzzles!</h2>
                <LogoutButton/>
            </div>
        </div>
    );
};

export default ComposeListHeader;
