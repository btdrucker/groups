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
            Log out
        </button>
    );
};

export default LogoutButton;

