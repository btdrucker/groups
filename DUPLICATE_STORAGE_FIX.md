# Removed Duplicate GameState Storage

## Issue
The `PlayListState` was storing `GameState` twice:
1. `gameStates: GameState[]` - For displaying the list
2. `gameStatesWithPuzzles: GameStateWithPuzzleStorage[]` - For Play component with loaded puzzles

This meant every gameState was duplicated in memory and in the redux-persist cache.

## Solution
Removed the `gameStates` array and kept only `gameStatesWithPuzzles` as the single source of truth.

## Changes Made

### PlayListState Interface
**Before:**
```typescript
interface PlayListState {
    gameStates: GameState[];
    gameStatesWithPuzzles: GameStateWithPuzzleStorage[];
    loading: boolean;
    error: string | null;
}
```

**After:**
```typescript
interface PlayListState {
    gameStatesWithPuzzles: GameStateWithPuzzleStorage[]; // Single source of truth
    loading: boolean;
    error: string | null;
}
```

### How It Works Now

**GameStateWithPuzzleStorage:**
```typescript
{
    gameState: GameState;
    puzzle: Puzzle | null;  // null for list, loaded for Play component
}
```

**For PlayList component:**
- `puzzle` is `null`
- Uses denormalized metadata from `gameState` (creatorName, createdAt, numGroups, etc.)
- Fast list display with no puzzle loading needed

**For Play component:**
- `puzzle` is loaded from Firestore via `loadGameStateWithPuzzle`
- Full puzzle data available (categories, words)
- Game can be played

### Updated Functions

1. **fetchUserGameStates** - Returns `GameStateWithPuzzleStorage[]` with null puzzles
2. **loadGameStateWithPuzzle** - Loads puzzle and updates the same entry in gameStatesWithPuzzles
3. **Reducers** - All work with `gameStatesWithPuzzles` array
4. **Selectors** - Read from `gameStatesWithPuzzles`

### Benefits

✅ **No duplicate storage** - GameState stored once
✅ **Simpler state structure** - Single source of truth
✅ **Less memory usage** - ~50% reduction for gameState data
✅ **Smaller redux-persist cache** - Faster load times
✅ **Same functionality** - PlayList and Play both work correctly

### Redux-Persist

The entire `playList` state (which contains `gameStatesWithPuzzles`) is persisted:
- On first load: Puzzles are `null` (loaded from Firestore)
- After playing: Puzzle is cached in the specific entry
- On return: List displays instantly from cached gameStates, Play loads puzzle if needed

## Memory Savings Example

**Before (with duplication):**
- 10 game states in `gameStates` array
- Same 10 game states in `gameStatesWithPuzzles` array
- Total: 20 gameState objects in memory

**After (no duplication):**
- 10 game states in `gameStatesWithPuzzles` array (with null puzzles for list)
- Total: 10 gameState objects in memory

**Savings: 50% reduction in gameState storage!**
