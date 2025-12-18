import React from "react";
import styles from "./style.module.css";
import {classes} from "./utils";

interface Props {
    onClick: () => void;
    icon: string;
    hideIconOnMobile?: boolean;
    disabled?: boolean;
    style?: React.CSSProperties;
    children: React.ReactNode;
}

const IconButton = ({onClick, icon, hideIconOnMobile, disabled, style, children}: Props) => {
    return (
        <button
            className={classes(styles.actionButton)}
            onClick={onClick}
            disabled={disabled ?? false}
            style={style ?? {}}
        >
            <i className={`fa-solid ${icon}`}></i> {hideIconOnMobile ? <span className={styles.hideOnMobile}>{children}</span> : children}
        </button>
    );
};

export default IconButton;
