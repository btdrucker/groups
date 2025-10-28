import React from "react"
import {useAppDispatch, useAppSelector} from "../../app/hooks"
import {selectGridCell} from "./slice";
import style from "./style.module.css"

interface Props {
    index: number
}

const GridCell = ({index}: Props) => {
    const gridCell = useAppSelector((state) => selectGridCell(state, index))
    return (
        <div className={style.cell}>
            {`gridcell[${index}]: ${gridCell.value}`}
        </div>
    )
}

export default GridCell
