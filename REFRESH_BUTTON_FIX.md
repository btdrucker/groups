# Refresh Button Not Fetching Fresh Data - Fix

## Problem
When clicking the refresh button in PlayListHeader after making changes to Firestore data in the web console:
1. Browser refresh didn't show changes
2. Clicking the refresh button didn't show changes
3. The number of mistakes didn't update as expected

## Root Cause
The `fetchUserGameStates` thunk had a cache check that prevented refetching:

```typescript
// OLD (BROKEN):
if (state.playList.gameStatesWithPuzzles.length > 0) {
    // Already loaded, skip fetching
    return state.playList.gameStatesWithPuzzles; // Returns stale cached data!
}
```

**What happened:**
1. User clicks "Refresh" button
2. `clearGameStatesCache()` dispatches (clears array)
3. `fetchUserGameStates(userId)` dispatches
4. Thunk checks cache length - but due to Redux batch updates or timing, it might see length > 0
5. Returns cached data without fetching from Firestore
6. User sees stale data

## The Fix

### 1. Added `force` Parameter to fetchUserGameStates

```typescript
// NEW (FIXED):
async ({ userId, force = false }: { userId: string; force?: boolean }, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    if (!force && state.playList.gameStatesWithPuzzles.length > 0) {
        // Already loaded, skip fetching (UNLESS force is true)
        return state.playList.gameStatesWithPuzzles;
    }
    // Fetch from Firestore...
}
```

### 2. Updated PlayList Component

Changed from:
```typescript
dispatch(fetchUserGameStates(user.uid));
```

To:
```typescript
dispatch(fetchUserGameStates({ userId: user.uid }));
```

### 3. Updated PlayListHeader Refresh Handler

Changed from:
```typescript
dispatch(clearGameStatesCache());
dispatch(fetchUserGameStates(user.uid));
```

To:
```typescript
dispatch(clearGameStatesCache());
dispatch(fetchUserGameStates({ userId: user.uid, force: true }));
```

## How It Works Now

### Initial Load (No Force)
1. User opens play list
2. `fetchUserGameStates({ userId })` called without force
3. Cache is empty, fetches from Firestore
4. Data displayed and cached

### Refresh Button (With Force)
1. User clicks refresh button
2. `clearGameStatesCache()` clears the cache
3. `fetchUserGameStates({ userId, force: true })` called
4. **force: true bypasses cache check**
5. Always fetches from Firestore
6. Fresh data displayed

### Subsequent Navigation (No Force)
1. User navigates away and back
2. `fetchUserGameStates({ userId })` called without force
3. Cache exists and is valid, returns cached data
4. Fast load, no Firestore read

## Benefits

✅ **Refresh button works** - Always fetches fresh data when clicked
✅ **Cache still works** - Normal navigation uses cache to save Firestore reads
✅ **Clear separation** - force=false for normal loads, force=true for explicit refresh
✅ **Cost optimization maintained** - Only bypasses cache when user explicitly refreshes

## Testing

1. Make a change to game state in Firestore web console
2. Click the refresh button in PlayListHeader
3. Should see updated data (e.g., corrected mistake count)
4. Navigate away and back - should use cached data (fast)
5. Click refresh again - should fetch fresh data

## Files Modified

1. `src/features/play-list/slice.ts` - Added force parameter to fetchUserGameStates
2. `src/features/play-list/PlayList.tsx` - Updated to pass userId as object
3. `src/features/play-list/PlayListHeader.tsx` - Updated to pass force: true on refresh
