import React from "react";
import { useAppDispatch } from "../../common/hooks";
import { signOutThunk } from "./slice";
import commonStyles from "../../common/style.module.css";

const LogoutButton: React.FC = () => {
    const dispatch = useAppDispatch();
    const handleLogout = () => {
        dispatch(signOutThunk());
    };
    return (
        <button className={`${commonStyles.actionButton} ${commonStyles.logout}`} onClick={handleLogout}>
            <span className={commonStyles.hideOnMobile}>Log out</span> <i className="fa-solid fa-right-from-bracket"></i>
        </button>
    );
};

export default LogoutButton;

