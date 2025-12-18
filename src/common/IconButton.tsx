import React from "react";
import styles from "./style.module.css";
import {classes} from "./utils";

interface Props {
    onClick: () => void;
    icon: string;
    disabled?: boolean;
    style?: React.CSSProperties;
    children: React.ReactNode;
}

const IconButton = ({onClick, icon, disabled, style, children}: Props) => {
    return (
        <button
            className={classes(styles.actionButton)}
            onClick={onClick}
            disabled={disabled ?? false}
            style={style ?? {}}
        >
            <i className={`fa-solid ${icon}`}></i> <span className={styles.hideOnMobile}>{children}</span>
        </button>
    );
};

export default IconButton;
