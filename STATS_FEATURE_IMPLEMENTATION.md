# Puzzle Player Stats Feature Implementation

## Overview
Added ability for puzzle authors to view player statistics for their puzzles, including player names, game status (won/lost/in progress), and which groups were solved.

## Implementation Summary

### 1. Data Model (firestore.ts)

**New Interface:**
```typescript
export interface PuzzlePlayerStats {
  id?: string;
  puzzleId: string;
  userId: string;
  userName: string;
  status: 'wip' | 'won' | 'lost';
  groupsSolved: number[];  // Array of group indices (0-based)
  lastUpdated: number;
}
```

**New Functions:**
- `createPuzzlePlayerStats()` - Creates initial stats doc when user starts playing (status: 'wip', groupsSolved: [])
- `updatePuzzlePlayerStats()` - Updates stats when game ends with final status and groups solved
- `getPuzzlePlayerStats()` - Queries all player stats for a puzzle (sorted by lastUpdated desc)

### 2. Firestore Security Rules

Added to `firestore.rules`:
```javascript
match /puzzlePlayerStats/{statId} {
  // Allow users to create and update their own stats
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null 
    && resource.data.userId == request.auth.uid;
  
  // Allow puzzle authors to read stats for their puzzles
  allow read: if request.auth != null &&
    exists(/databases/$(database)/documents/puzzles/$(resource.data.puzzleId)) &&
    get(/databases/$(database)/documents/puzzles/$(resource.data.puzzleId)).data.creatorId == request.auth.uid;
}
```

### 3. Play Component Integration

**Stats Creation:**
- Added useEffect that creates stats document when puzzle loads
- Uses `user.displayName` from Firebase Auth
- Only creates if doesn't already exist (prevents duplicates)

**Stats Updates:**
- **Game Lost:** Updates stats in reveal useEffect when `mistakesRemaining === 0`
- **Game Won:** Updates stats in `processCorrectGuess` when all groups solved
- Both calculate `groupsSolved` from final guesses using `calculateGroupsSolved()` helper

**Helper Function:**
```typescript
const calculateGroupsSolved = (guesses: number[], numGroups: number, wordsPerGroup: number): number[]
```
Determines which groups were correctly guessed from the guesses bit flags.

### 4. New Stats Feature (src/features/stats/)

**Files Created:**
- `Stats.tsx` - Main stats component with table display
- `StatsHeader.tsx` - Header with Back and Refresh buttons
- `style.module.css` - Styling for stats table and badges

**Stats.tsx Features:**
- Loads stats for a puzzle using `getPuzzlePlayerStats()`
- Displays player name, status (Won/Lost/In Progress), and groups solved
- Groups solved shown as colored badges matching Play component colors
- Handles permission errors gracefully
- Shows "No one has played this puzzle yet" if empty
- Refresh button to reload stats
- Mobile responsive design

### 5. Compose List Integration

**ComposeListItem.tsx:**
- Added "View Stats" button next to Share button
- Uses `fa-chart-simple` icon
- Navigates to `/stats/:puzzleId`
- Shows for all puzzles (loads stats on demand)
- Click doesn't trigger card navigation (stopPropagation)

### 6. Routing

**App.tsx:**
- Added route: `/stats/:puzzleId` → Stats component

## Cost Optimization

**Firestore Writes:**
- 1 write when user first loads puzzle (creates stats doc)
- 1 write when game ends (won or lost)
- Total: **2 writes per player per puzzle**

No writes on each category solved, keeping costs low.

**Firestore Reads:**
- Only when author clicks "View Stats" button
- No real-time updates
- No automatic loading

## Features

✅ Track player progress (won/lost/in progress)
✅ Show which groups were solved
✅ Display player names
✅ Colored badges for groups (matching Play component)
✅ Sort by most recent activity
✅ Access control (only puzzle author can view)
✅ Mobile responsive
✅ Cost-efficient (minimal writes)
✅ Refresh capability
✅ Error handling for permissions

## Future Enhancements (Not Implemented)

- Pagination for large player counts
- Summary stats (X won, Y lost, Z in progress)
- Export stats to CSV
- Time tracking (how long to complete)
- Filtering/sorting options
- Delete player stats when game state deleted

## Testing Checklist

- [ ] Create a new puzzle and share it
- [ ] Play the puzzle from another account
- [ ] Verify stats doc created when game starts
- [ ] Win the game and verify stats updated correctly
- [ ] Lose the game and verify stats show groups solved
- [ ] View stats as puzzle author
- [ ] Try to view stats as non-author (should get permission error)
- [ ] Verify colored badges match Play component
- [ ] Test on mobile device
- [ ] Refresh stats and verify updates
