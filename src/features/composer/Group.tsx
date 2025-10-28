import React from "react"
import {
    GroupIdOwner,
    GroupModel,
} from "./slice"
// @ts-ignore
import style from "./style.module.css"
import {classes} from "../../common/classUtils";
import Title from "./Title";
import GroupWord from "./GroupWord";

interface Props extends GroupIdOwner {
    group: GroupModel
}

const groupStyles = [style.group0, style.group1, style.group2, style.group3]

const Group = ({groupId, group}: Props) => {
    return (
        <div className={classes(groupStyles[groupId], style.group)}>
            <Title
                groupId={groupId}
                value={group.title}
            />
            {group.words.map((word, index) => {
                return (
                    <GroupWord
                        key={index}
                        groupId={groupId}
                        wordId={index}
                        value={word}
                    />
                )
            })}
        </div>
    )
}

export default Group