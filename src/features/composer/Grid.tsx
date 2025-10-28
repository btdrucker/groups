import React from "react"
import GridRow from "./GridCell";
import style from "./style.module.css"
import {useAppSelector} from "../../app/hooks";
import {selectGridCell, selectGridLength} from "./slice";
import GridCell from "./GridCell";

const range = (n: number) => Array.from({length: n}, (value, key) => key)

const Grid = () => {
    const gridLength = useAppSelector(selectGridLength)
    console.log(`grid length: ${gridLength}`)
    const grid = useAppSelector(state => state.composer.grid)
    console.log("grid", grid)
    return (
        <div className={style.grid}>
            {range(gridLength).map(index => {
                return (
                    <GridCell
                        key={index}
                        index={index}
                    />
                )
            })}
        </div>
    )
}

export default Grid