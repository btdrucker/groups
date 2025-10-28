import React from "react"
import {selectGameLink} from "./slice"
import {useAppSelector} from "../../app/hooks"
import style from "./style.module.css"

const GameLink = () => {
    const gameLink = useAppSelector(selectGameLink)

    return (
        <div className={!gameLink ? style.hidden : style.gameLink}>
            {gameLink}
        </div>
    )
}

export default GameLink
