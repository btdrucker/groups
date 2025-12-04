import React from "react";
import styles from "./style.module.css";
import {classes} from "./classUtils";

interface Props {
    onClick: () => void;
    icon: string;
    children: React.ReactNode;
}

const IconButton = ({onClick, children, icon}: Props) => {
    return (
        <button className={classes(styles.actionButton)} onClick={onClick}>
            <i className={`fa-solid ${icon}`}></i> <span className={styles.hideOnMobile}>{children}</span>
        </button>
    );
};

export default IconButton;
