import React from "react";
import { useAppDispatch } from "./hooks";
import { signOutThunk } from "../features/auth/slice";
import styles from "./style.module.css";
import {classes} from "./classUtils";

const LogoutButton: React.FC = () => {
    const dispatch = useAppDispatch();
    const handleLogout = () => {
        dispatch(signOutThunk());
    };
    return (
        <button className={classes(styles.actionButton, styles.logout)} onClick={handleLogout}>
            <span className={styles.hideOnMobile}>Log out</span> <i className="fa-solid fa-right-from-bracket"></i>
        </button>
    );
};

export default LogoutButton;

