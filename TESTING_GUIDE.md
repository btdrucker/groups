# Testing Guide for React Router Implementation

## ✅ Fixed Issues

### Auth Screen Not Showing After Logout
**Issue**: After logging out, the auth screen appeared as a blank white rounded rectangle with no form contents.

**Root Cause**: The `AuthScreen` component was comparing `authMode` against string values (`'login'`, `'signup'`, `'reset'`) instead of the `AuthMode` enum values (`AuthMode.LOGIN`, `AuthMode.SIGNUP`, `AuthMode.RESET`).

**Fix**: Updated `AuthScreen.tsx` to import and use the `AuthMode` enum for comparisons.

---

## Manual Testing Checklist

### 1. Basic Navigation
- [ ] Visit homepage (`/`) - should show ComposeList if logged in, AuthScreen if not
- [ ] Click "Play puzzles" button - should navigate to `/puzzles`
- [ ] Click "Make puzzles" button - should navigate to `/` (home)
- [ ] Click "Create new puzzle" button - should navigate to `/compose`

### 2. Puzzle Sharing Flow (Non-Authenticated User)
1. [ ] Open app in incognito/private browser (not logged in)
2. [ ] Visit a puzzle URL directly: `/play/{puzzleId}` (replace with actual puzzle ID)
3. [ ] Should see the AuthScreen (login/signup forms)
4. [ ] Sign up or log in
5. [ ] After authentication, should be automatically redirected to the puzzle
6. [ ] Puzzle should load and be playable

### 3. Puzzle Sharing Flow (Authenticated User)
1. [ ] Log in to the app
2. [ ] Create or view a puzzle
3. [ ] Navigate to play the puzzle
4. [ ] Click "Share Puzzle" button
5. [ ] Should see "Link copied to clipboard!" message
6. [ ] Paste the URL in a new browser tab
7. [ ] Should navigate directly to the puzzle

### 4. Share Button Functionality
- [ ] Share button appears on the Play screen
- [ ] Clicking share button copies URL to clipboard
- [ ] Confirmation message appears after copying
- [ ] Confirmation message disappears after 2 seconds
- [ ] URL format is correct: `{origin}/groups/play/{puzzleId}`

### 5. Browser Navigation
- [ ] Back button works correctly
- [ ] Forward button works correctly
- [ ] Bookmarking a puzzle URL works
- [ ] Refreshing the page maintains the correct state

### 6. Protected Routes
- [ ] `/compose` - redirects to `/` if not authenticated
- [ ] `/puzzles` - redirects to `/` if not authenticated
- [ ] `/play/:puzzleId` - shows auth screen but stays on the route if not authenticated

### 7. Edge Cases
- [ ] Invalid puzzle ID in URL shows appropriate error
- [ ] Logging out from any page redirects correctly
- [ ] Switching between puzzles updates URL correctly
- [ ] Direct navigation to `/` works when already on another route

## Example URLs to Test

Assuming your app is running on `http://localhost:5173`:

1. Home: `http://localhost:5173/groups/`
2. Compose: `http://localhost:5173/groups/compose`
3. Play List: `http://localhost:5173/groups/puzzles`
4. Play Specific Puzzle: `http://localhost:5173/groups/play/{puzzleId}`

## Getting a Puzzle ID for Testing

1. Log in to your app
2. Create a puzzle in the Compose screen
3. Save the puzzle
4. Go back to ComposeList
5. Click "Play" on the puzzle
6. Look at the URL in the address bar - the puzzle ID is the last part
7. Copy this ID for testing the sharing flow

## Expected Behavior Summary

### For Authenticated Users:
- Can navigate freely between all routes
- Can share puzzle URLs
- Clicking puzzle links loads the puzzle immediately

### For Non-Authenticated Users:
- Can access puzzle URLs (stores pending puzzle ID)
- Sees auth screen on protected routes
- After login/signup, redirected to pending puzzle (if any)

## Common Issues to Watch For

1. **Auth state not persisting**: Firebase auth should persist across page refreshes
2. **Puzzle not loading**: Check that `loadPuzzleById` thunk is dispatched correctly
3. **Share URL incorrect**: Verify the `window.location.origin` and basename match deployment
4. **Redirect loop**: Ensure protected routes don't create infinite redirects
5. **Pending puzzle not clearing**: After navigation to pending puzzle, state should clear

