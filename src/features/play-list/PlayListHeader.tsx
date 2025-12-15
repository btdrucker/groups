import React from "react";
import {useNavigate} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../common/hooks";
import {selectUser} from "../auth/slice";
import {clearGameStatesCache, fetchUserGameStates} from "./slice";
import LogoutButton from "../../common/LogoutButton";
import styles from "./style.module.css";
import IconButton from "../../common/IconButton";

const PlayListHeader: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector(selectUser);

    const handleMakePuzzles = () => {
        navigate("/");
    };

    const handleRefresh = () => {
        if (user?.uid) {
            dispatch(clearGameStatesCache());
            dispatch(fetchUserGameStates({ userId: user.uid, force: true }));
        }
    };

    return (
        <div className={styles.headerSticky}>
            <div className={styles.headerContent}>
                <IconButton onClick={handleMakePuzzles} icon="fa-pen-to-square">Make puzzles</IconButton>
                <h2 className={styles.screenTitle}>Play Puzzles!</h2>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <IconButton onClick={handleRefresh} icon="fa-refresh">Refresh</IconButton>
                    <LogoutButton/>
                </div>
            </div>
        </div>
    );
};

export default PlayListHeader;
