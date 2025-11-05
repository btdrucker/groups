import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {RootState} from "../../common/store"

export const NUM_WORDS_IN_GROUP = 4
export const NUM_GROUPS = 4

export interface GroupModel {
    title?: string
    words: (string | undefined)[]
}

function emptyGroupModel(): GroupModel {
    return {
        title: undefined,
        words: new Array(NUM_WORDS_IN_GROUP).fill(undefined)
    }
}

export interface GroupIdOwner {
    groupId: number
}

export interface WordIdOwner {
    wordId: number
}

function emptyStringOwner(): StringOwner {
    return {value: undefined}
}

export interface StringOwner {
    value?: string
}

function isGroupDefined(group: GroupModel): boolean {
    return !!group.title && !!group.words[0] && !!group.words[1] && !!group.words[2] && !!group.words[3]
}

function areGroupsDefined(groups: GroupModel[]) {
    return isGroupDefined(groups[0]) && isGroupDefined(groups[1]) &&isGroupDefined(groups[2]) &&isGroupDefined(groups[3])
}

const slice = createSlice({
    name: 'composer',
    initialState: {
        groups: new Array<GroupModel>(NUM_GROUPS).fill(emptyGroupModel()),
        grid: new Array<StringOwner>(NUM_GROUPS * NUM_WORDS_IN_GROUP).fill(emptyStringOwner()),
        isGameLinkEnabled: false,
        gameLink: "https://google.com" as (string | undefined)
    },
    reducers: {
        updateGroupWord: (
            state,
            action: PayloadAction<GroupIdOwner & WordIdOwner & StringOwner>
        ) => {
            const {groupId, wordId, value} = action.payload
            const group = state.groups[groupId]
            group.words[wordId] = value
            state.groups[groupId] = group
            state.isGameLinkEnabled = areGroupsDefined(state.groups)
            state.gameLink = undefined
        },
        updateGroupTitle: (
            state,
            action: PayloadAction<GroupIdOwner & StringOwner>
        ) => {
            const {groupId, value} = action.payload
            const group = state.groups[groupId]
            group.title = value
            state.groups[groupId] = group
            state.isGameLinkEnabled = areGroupsDefined(state.groups)
            state.gameLink = undefined
        },
        makeGameLink: (state) => {
            if (state.isGameLinkEnabled) {
                state.gameLink = "https://btdrucker.github.io/groups/123"
            }
        },
    }
})

export const selectGroups = (state: RootState) => state.composer.groups
export const selectIsGameLinkEnabled = (state: RootState) => state.composer.isGameLinkEnabled
export const selectGameLink = (state: RootState) => state.composer.gameLink

const selectGridInput = (state: RootState) => state.composer.grid
const selectGridCellInput = (_: RootState, index: number) => index

export const selectGridCell = createSelector(
    [selectGridInput, selectGridCellInput],
    (grid, index) => grid[index]
)

export const selectGridLength = createSelector(
    [selectGridInput],
    (grid) => grid.length
)

export const {
    updateGroupWord,
    updateGroupTitle,
    makeGameLink,
} = slice.actions

export default slice.reducer