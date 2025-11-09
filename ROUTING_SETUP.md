# React Router Setup

## Overview
React Router has been added to enable URL-based navigation and sharing of puzzles.

## Routes

The application now supports the following routes:

- `/` - Home page (ComposeList for authenticated users, Auth screen for non-authenticated)
- `/play/:puzzleId` - Play a specific puzzle by ID
- `/compose` - Create or edit a puzzle
- `/puzzles` - View list of puzzles to play (PlayList)

## Key Features

### 1. Deep Linking to Puzzles
Users can now share a direct link to a puzzle: `https://your-domain.com/groups/play/{puzzleId}`

When a non-authenticated user visits a puzzle link:
1. They are shown the auth screen (login/signup)
2. The puzzle ID is stored in Redux (`pendingPuzzleId`)
3. After successful authentication, they are automatically redirected to play that puzzle

### 2. Share Button
Each puzzle now has a "Share Puzzle" button that:
- Copies the puzzle URL to the clipboard
- Shows a confirmation message
- Allows users to easily share puzzles with friends

### 3. URL-Based Navigation
Navigation now uses React Router instead of Redux app mode:
- Uses `useNavigate()` hook for programmatic navigation
- Uses `useLocation()` to determine current route
- Supports browser back/forward buttons

## Changes Made

### New Files
- `src/features/app/Router.tsx` - Main router component with route definitions and route-specific components

### Modified Files

1. **src/main.jsx**
   - Changed from using `<App />` to `<AppRouter />`

2. **src/features/app/slice.ts**
   - Added `pendingPuzzleId` to state
   - Added `setPendingPuzzleId` action and selector

3. **src/features/play/slice.ts**
   - Added `loadPuzzleById` async thunk to fetch puzzle by ID
   - Updated `selectPuzzle` to return `Puzzle | undefined`
   - Added loading and error states

4. **src/features/play/Play.tsx**
   - Added null check for `currentPuzzle`
   - Added share button functionality
   - Added copy success message
   - Fixed creator name to use puzzle creator info

5. **src/features/app/WelcomeUser.tsx**
   - Updated to use `useNavigate()` and `useLocation()` instead of Redux actions
   - Navigation now based on route path instead of app mode

6. **src/features/compose-list/ComposeListItem.tsx**
   - Updated to use `navigate()` for navigation

7. **src/features/play-list/PlayListItem.tsx**
   - Updated to use `navigate()` for navigation

8. **src/features/play/style.module.css**
   - Added styles for share button
   - Added styles for copy success message

### Dependencies Added
- `react-router-dom` - For routing functionality

## Usage Example

To share a puzzle with a friend:
1. Create or view a puzzle
2. Click the "Share Puzzle" button
3. The URL will be copied to clipboard
4. Share the URL with your friend
5. When they visit the URL, they'll be prompted to sign in/up
6. After authentication, they'll be taken directly to the puzzle

## Notes

- The `basename="/groups"` is set in the router to match the GitHub Pages deployment path
- Auth state is managed by Firebase and persists across sessions
- Puzzle URLs are shareable even if the recipient isn't logged in

