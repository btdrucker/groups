import React from "react"
import {GroupIdOwner, StringOwner, updateGroupTitle} from "./slice"
import {useAppDispatch} from "../../app/hooks"
import EditableItem from "../../common/EditableItem";

interface Props extends GroupIdOwner, StringOwner {
}

const Title = ({groupId, value}: Props) => {
    const dispatch = useAppDispatch()

    return (
        <EditableItem
            initialValue={value}
            placeholder="Enter a group title"
            onChange={value => dispatch(updateGroupTitle({groupId, value}))}
        />
    )
}

export default Title