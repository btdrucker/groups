import React from "react";
import {selectGroups} from "./slice";
import {useAppSelector} from "../../app/hooks";
import Group from "./Group";
import Grid from "./Grid";
import GameLink from "./GameLink";

const Composer = () => {
    const groups = useAppSelector(selectGroups)

    return (
        <>
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
        </>
    )
}

export default Composer
