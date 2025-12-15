# Play List Empty Display Fix

## Problem
The play list was showing "You have no puzzles you are playing yet." even when game states existed in the persisted cache.

## Root Cause
After refactoring from `gameStates` array to `gameStatesWithPuzzles` array:

1. **Old persisted data** had structure: `{ playList: { gameStates: [...] } }`
2. **New code expected**: `{ playList: { gameStatesWithPuzzles: [...] } }`
3. **Selector guard** was returning empty array when data structure didn't match
4. **Redux-persist** loaded the old structure, but code couldn't read it

## Solution

### 1. Added Redux-Persist Migration (store.ts)
Incremented version to 2 and added migration function:

```typescript
version: 2,
migrate: (state: any) => {
    // Convert old gameStates array to gameStatesWithPuzzles
    if (state?.playList?.gameStates && !state.playList.gameStatesWithPuzzles) {
        state.playList.gameStatesWithPuzzles = state.playList.gameStates.map((gameState: any) => ({
            gameState,
            puzzle: null
        }));
        delete state.playList.gameStates;
    }
    return Promise.resolve(state);
}
```

### 2. Improved Selector Guard (slice.ts)
Made the guard less aggressive - only filters out truly invalid entries:

```typescript
if (!gameStatesWithPuzzles) {
    return [];
}

if (!Array.isArray(gameStatesWithPuzzles)) {
    console.error('gameStatesWithPuzzles is not an array:', gameStatesWithPuzzles);
    return [];
}

return [...gameStatesWithPuzzles]
    .filter(gsp => gsp && gsp.gameState) // Filter out any invalid entries
    .map(...)
```

## How Migration Works

1. **First load after update**: Redux-persist detects version mismatch (1 → 2)
2. **Runs migration**: Converts `gameStates` array to `gameStatesWithPuzzles` format
3. **Saves migrated state**: New structure persisted with version 2
4. **Subsequent loads**: No migration needed, loads directly with correct structure

## User Impact

- **Existing users**: Persisted game states automatically migrated on first app load
- **New users**: Start with version 2 structure directly
- **No data loss**: All existing game states preserved and accessible

## Testing

After this change:
1. Clear localStorage to simulate fresh start OR
2. Refresh browser to trigger migration
3. Play list should display existing game states correctly
4. Check browser console for migration messages (if any)
