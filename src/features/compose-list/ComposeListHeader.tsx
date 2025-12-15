import React from "react";
import {useNavigate} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../common/hooks";
import {selectUser} from "../auth/slice";
import {clearPuzzlesCache} from "./slice";
import {fetchUserPuzzles} from "./slice";
import styles from "./style.module.css";
import LogoutButton from "../../common/LogoutButton";
import IconButton from "../../common/IconButton";

const ComposeListHeader: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(selectUser);

    const handlePlayPuzzles = () => {
        navigate("/play-list");
    };

    const handleRefresh = () => {
        if (user?.uid) {
            dispatch(clearPuzzlesCache());
            dispatch(fetchUserPuzzles(user.uid));
        }
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContent}>
                <IconButton onClick={handlePlayPuzzles} icon="fa-puzzle-piece">Play puzzles</IconButton>
                <h2 className={styles.screenTitle}>Make Puzzles!</h2>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <IconButton onClick={handleRefresh} icon="fa-refresh">Refresh</IconButton>
                    <LogoutButton/>
                </div>
            </div>
        </div>
    );
};

export default ComposeListHeader;
