# PuzzlePlayerStats Migration Guide

This guide explains how to run the migration to backfill historical `puzzlePlayerStats` data from existing game states.

## What This Migration Does

The migration script:
1. Reads all existing game states from Firestore
2. For each game state, calculates:
   - Game status (WIP/WON/LOST)
   - Which groups were solved
3. Creates a `puzzlePlayerStats` document if one doesn't already exist for that puzzle-user combination

## Prerequisites

- You must be logged in as an authenticated user in the app
- You need appropriate Firestore permissions (see below)

## Running the Migration

### Step 1: Temporarily Relax Firestore Rules

The current Firestore rules only allow users to create stats documents where `userId` matches their own `uid`. Since the migration creates stats for all users, you need to temporarily relax this rule.

**Edit `firestore.rules`:**

Find this section:
```
// Puzzle player stats collection
match /puzzlePlayerStats/{statId} {
  // Allow users to create and update their own stats documents
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;
```

**Temporarily change it to:**
```
// Puzzle player stats collection
match /puzzlePlayerStats/{statId} {
  // TEMPORARY: Allow any authenticated user to create stats (for migration)
  allow create: if request.auth != null;
```

**Deploy the rules:**
```bash
firebase deploy --only firestore:rules
```

### Step 2: Run the Migration

Run the migration from the browser console:

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Open your app in a browser (usually http://localhost:5173)
3. Log in as an authenticated user
4. Open the browser console (F12 or Cmd+Opt+I on Mac)
5. Run:
   ```javascript
   import('./src/runMigration.ts').then(m => m.default())
   ```
6. Watch the console output for progress and completion

### Step 3: Restore Original Firestore Rules

After the migration completes successfully:

**Restore the original rule in `firestore.rules`:**
```
// Puzzle player stats collection
match /puzzlePlayerStats/{statId} {
  // Allow users to create and update their own stats documents
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;
```

**Deploy the rules:**
```bash
firebase deploy --only firestore:rules
```

## Migration Output

The migration will log:
- Number of puzzles loaded
- Number of existing stats documents found
- Number of game states to process
- Progress updates every 50 documents
- Final summary with:
  - Total stats created
  - Any errors encountered
  - Duration

## Expected Results

The migration creates `puzzlePlayerStats` documents for each unique puzzle-user combination found in game states. Each document contains:
- `puzzleId`: ID of the puzzle
- `userId`: ID of the player
- `userName`: "Unknown Player" (placeholder since game states don't store user names)
- `status`: "wip", "won", or "lost"
- `groupsSolved`: Array of group indices that were solved
- `lastUpdated`: Timestamp of creation

## Troubleshooting

### "Permission denied" errors
- Make sure you temporarily relaxed the Firestore rules (Step 1)
- Make sure you deployed the rules: `firebase deploy --only firestore:rules`
- Make sure you're logged in as an authenticated user

### "Game state references missing puzzle" warnings
- Some game states may reference deleted puzzles
- These are logged but don't stop the migration
- They will be skipped

### Migration runs but creates 0 documents
- This means stats already exist for all game states
- This is normal if you run the migration multiple times

## Clean Up

After the migration:
1. Verify the stats were created by checking the Stats page in your app
2. Restore the original Firestore rules (Step 3)
3. The migration script can remain in the codebase for reference
