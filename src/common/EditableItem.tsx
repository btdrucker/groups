import React from "react"
import {classes} from "./classUtils"
import style from "./style.module.css"

export interface Props {
    initialValue?: string
    placeholder?: string
    extraClass?: string
    onChange: (value?: string) => void
}

const EditableItem = ({initialValue, placeholder, extraClass, onChange}: Props) => {
    let isEditPending = false

    const handleOnKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const element = event.target as HTMLInputElement
        switch (event.key) {
            case "Enter": {
                event.preventDefault()
                const trimmedName = element.value.trim() || undefined
                if (trimmedName !== initialValue) {
                    isEditPending = true
                }
                element.blur()
                break
            }
            case "Escape": {
                element.value = initialValue || ""
                element.blur()
                break
            }
        }
    }

    const handleOnClick = (event: React.MouseEvent<HTMLInputElement>) => {
        const element = event.target as HTMLInputElement
        element.focus()
    }

    const handleOnBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        const element = event.target as HTMLInputElement
        if (!isEditPending) {
            element.value = initialValue || ""
            isEditPending = false
        }
        else if (onChange) {
            onChange(element.value)
        }
        element.blur()
    }

    return (
        <input
            className={classes(style.editableItem, extraClass)}
            defaultValue={initialValue}
            placeholder={placeholder}
            onKeyUp={handleOnKeyUp}
            onClick={handleOnClick}
            onBlur={handleOnBlur}
        />
    )
}

export default EditableItem