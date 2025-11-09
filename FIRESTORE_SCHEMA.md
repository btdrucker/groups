# Firestore Database Setup

## Overview

This app uses Firestore to store user puzzles and game states. The schema is designed to support:
- Creating and storing custom puzzles
- Tracking user progress on puzzles
- Sharing puzzles via email links

## Collections

### `puzzles`
Stores puzzles created by users.

**Fields:**
- `creatorId` (string): Firebase Auth UID of the creator
- `categories` (array of strings): Array of 4 category names
- `words` (array of strings): Flat array of 16 words (4 words per category)
- `createdAt` (timestamp): When the puzzle was created

### `gameStates`
Tracks user progress when playing puzzles.

**Fields:**
- `userId` (string): Play's Firebase Auth UID
- `puzzleId` (string): Reference to the puzzle document ID
- `guesses` (array of numbers): Array of guesses represented by 16-bit numbers (one bit for each word)
- `solvedCategories` (array of numbers): Indices of solved categories (0-3)

## Security Rules

You need to set up Firestore security rules in the Firebase Console. Go to Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own compose-list
    match /puzzles/{puzzleId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.creatorId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.creatorId;
    }
    
    // Allow users to read and write their own game states
    match /gameStates/{gameStateId} {
      allow read, write: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Required Firestore Indexes

For the queries used in this app, you may need to create composite indexes:

1. **puzzles collection:**
   - Fields: `creatorId` (Ascending), `createdAt` (Descending)
   - Query scope: Collection

2. **gameStates collection:**
   - Fields: `userId` (Ascending), `puzzleId` (Ascending)
   - Query scope: Collection

Firebase will prompt you to create these indexes when you first run queries that need them. Simply click the provided link to auto-create the index.

## Setup Steps

1. **Enable Firestore:**
   - Go to Firebase Console > Firestore Database
   - Click "Create database"
   - Choose production mode
   - Select a location

2. **Add Security Rules:**
   - Copy the rules above
   - Go to Firestore Database > Rules
   - Paste and publish

3. **Create Indexes (when prompted):**
   - Run your app
   - When you get an error about missing indexes, click the link in the error
   - Firebase will auto-create the required indexes

## API Usage

The Firestore API is abstracted in `/src/firebase/firestore.ts`:

```typescript
// Create a puzzle
const { id, error } = await createPuzzle({
  creatorId: user.uid,
  creatorEmail: user.email,
  categories: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
  words: [
    ['word1', 'word2', 'word3', 'word4'],
    ['word5', 'word6', 'word7', 'word8'],
    // ... 2 more arrays
  ]
});

const { puzzles, error } = await getUserPuzzles(user.uid);

    'word1', 'word2', 'word3', 'word4',   // Category 1
    'word5', 'word6', 'word7', 'word8',   // Category 2
    'word9', 'word10', 'word11', 'word12', // Category 3
    'word13', 'word14', 'word15', 'word16' // Category 4

## Navigation Flow

1. **Login** → User sees `ComposeList` component
2. **ComposeList** → Shows all puzzles created by the user
3. **Click "Create New Puzzle"** → Navigate to `Compose` component
4. **Compose** → Create puzzle with back button to return to list
5. **Save puzzle** → Store in Firestore and return to list

// Save game state
const { id, error } = await saveGameState({
  userId: user.uid,
  puzzleId: 'puzzle123',
  guesses: [0b0000000000001111], // Example: first 4 words selected
  solvedCategories: [0] // Category 0 solved
});

// Get user's game state for a puzzle
const { gameState, error } = await getGameState(user.uid, puzzleId);

