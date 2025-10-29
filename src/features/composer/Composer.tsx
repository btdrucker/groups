import React from "react";
import {selectGroups} from "./slice";
import {useAppSelector} from "../../app/hooks";
import Group from "./Group";
import Grid from "./Grid";
import GameLink from "./GameLink";
import styles from "./style.module.css";

interface ComposerProps {
    onBack?: () => void;
}

const Composer: React.FC<ComposerProps> = ({ onBack }) => {
    const groups = useAppSelector(selectGroups)

    return (
        <div className={styles.composerContainer}>
            {onBack && (
                <button className={styles.backButton} onClick={onBack}>
                    ← Back to My Puzzles
                </button>
            )}
            {groups.map((group, index) => {
                return (
                    <Group
                        key={index}
                        groupId={index}
                        group={group}
                    />
                )
            })}
            <Grid/>
            <GameLink/>
        </div>
    )
}

export default Composer
