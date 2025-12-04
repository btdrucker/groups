import React from "react";
import {useNavigate} from "react-router-dom";
import {useAppSelector} from "../../common/hooks";
import {selectUser} from "../auth/slice";
import LogoutButton from "../../common/LogoutButton";
import styles from "./style.module.css";
import IconButton from "../../common/IconButton";

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
                <IconButton onClick={handleMakePuzzles} icon="fa-pen-to-square">Make puzzles</IconButton>
                <h2 className={styles.screenTitle}>Play Puzzles!</h2>
                <LogoutButton/>
            </div>
        </div>
    );
};

export default PlayListHeader;
