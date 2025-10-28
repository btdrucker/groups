import React from "react"
import {
    GroupIdOwner, StringOwner, updateGroupWord, WordIdOwner,
} from "./slice"
import {useAppDispatch} from "../../app/hooks"
import EditableItem from "../../common/EditableItem";

interface Props extends GroupIdOwner, WordIdOwner, StringOwner {
}

const GroupWord = ({groupId, wordId, value}: Props) => {
    const dispatch = useAppDispatch()

    return (
        <EditableItem
            initialValue={value}
            placeholder="Enter a group word"
            onChange={value => dispatch(updateGroupWord({groupId, wordId, value}))}
        />
    )
}

export default GroupWord