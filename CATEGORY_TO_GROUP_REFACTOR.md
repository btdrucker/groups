# Category to Group Refactoring

## Summary
Successfully standardized terminology throughout the codebase from "category/categories" to "group/groups" for consistency.

## Files Changed

### TypeScript/React Files

#### 1. `/src/firebase/firestore.ts`
- **Interface Changes:**
  - ⚠️ **KEPT AS `categories`** - The Puzzle interface field name remains `categories` for backend compatibility
  - Updated comment to clarify: "Array of 4 category names (stored as 'categories' in Firestore)"
  - Updated other comments: "Number of groups/categories" → "Number of groups"

#### 2. `/src/features/play/Play.tsx`
- **Interface Changes:**
  - `DisplayedCategory` → `DisplayedGroup`
  - `categoryIndex` → `groupIndex`

- **Function Renames:**
  - `getNumCategories()` → `getNumGroups()`
  - `getWordsPerCategory()` → `getWordsPerGroup()`
  - `numCorrectWordsForCategory()` → `numCorrectWordsForGroup()`
  - `moveCategoryWordsToGridRow()` → `moveGroupWordsToGridRow()`
  - `categoryWords()` → `groupWords()`
  - `handleCategoryNameChange()` → `handleGroupNameChange()` (in Compose.tsx)

- **Variable Renames:**
  - `numCategories` → `numGroups`
  - `wordsPerCategory` → `wordsPerGroup`
  - `categoryIndex` → `groupIndex`
  - `categoryMask` → `groupMask`
  - `categoryWords` → `groupWordsArray`
  - `displayedCategories` → `displayedGroups`
  - `startingDisplayedCategories` → `startingDisplayedGroups`
  - `catIdx` → `grpIdx`
  - `cat` → `grp`

- **Comment Updates:**
  - All comments referencing "category" updated to "group"

#### 3. `/src/features/play-list/slice.ts`
- **Function Updates:**
  - `isGuessCorrect()` parameter: `categoryIndex` → `groupIndex`
  - Comments updated to use "group" terminology
  - Variable names: `categoryIndex` → `groupIndex`, `categoryMask` → `groupMask`

#### 4. `/src/features/compose-list/slice.ts`
- **Function Updates:**
  - `isPuzzleComplete()`: `hasAllCategories` → `hasAllGroups`
  - `puzzle.categories` → `puzzle.groups`
  - Variable `cat` → `grp`

#### 5. `/src/features/compose/Compose.tsx`
- **Function Updates:**
  - `isPuzzleStarted()`: `puzzle.categories` → `puzzle.groups`
  - `isPuzzleChanged()`: `puzzle.categories` → `puzzle.groups`
  - `handleCategoryNameChange()` → `handleGroupNameChange()`

- **Variable Renames:**
  - `emptyPuzzle.categories` → `emptyPuzzle.groups`
  - `catIdx` → `grpIdx`
  - `cat` → `grp`
  - Loop variables updated throughout

- **JSX Updates:**
  - Placeholder text: "Category N" → "Group N"
  - All refs and handlers updated to use group terminology

### CSS Files

#### 1. `/src/common/style.module.css`
- **CSS Variables:**
  - `--category0Color-rgb` → `--group0Color-rgb`
  - `--category1Color-rgb` → `--group1Color-rgb`
  - `--category2Color-rgb` → `--group2Color-rgb`
  - `--category3Color-rgb` → `--group3Color-rgb`

#### 2. `/src/features/compose/style.module.css`
- **Class Renames:**
  - `.categoryBlock` → `.groupBlock`
  - `.categoryTextarea` → `.groupTextarea`
  - `.categoryInput1-4` → `.groupInput1-4`

- **CSS Variable Updates:**
  - All references to `--category*Color-rgb` → `--group*Color-rgb`

#### 3. `/src/features/play/style.module.css`
- **Class Renames:**
  - `.categoryRow` → `.groupRow`
  - `.categoryName` → `.groupName`
  - `.categoryWords` → `.groupWords`
  - `.missedCategory` → `.missedGroup`

- **Data Attribute Updates:**
  - `data-category-index` → `data-group-index`

- **CSS Variable Updates:**
  - All references to `--category*Color-rgb` → `--group*Color-rgb`

## Important Note: Backend Compatibility

✅ **No Backend Migration Needed:**
The `Puzzle` interface in `firestore.ts` still uses `categories` as the field name to maintain compatibility with existing Firestore data. This was intentionally kept to avoid the need for a database migration.

Throughout the rest of the codebase, we use "group" terminology in:
- Variable names (e.g., `numGroups`, `wordsPerGroup`, `groupIndex`)
- Function names (e.g., `getNumGroups()`, `moveGroupWordsToGridRow()`)
- Interface names (e.g., `DisplayedGroup`)
- CSS class names (e.g., `.groupRow`, `.groupName`)
- Comments and documentation

This provides consistent "group" terminology for developers while maintaining `categories` as the storage field name.

## Testing Notes

- Build completed successfully with no errors
- All TypeScript compilation passes
- CSS classes properly renamed and should maintain visual consistency
- Function signatures updated consistently throughout

## Next Steps

If there are existing puzzles in Firestore:
1. Run a migration to rename the `categories` field to `groups` in all puzzle documents
2. Test with existing game states to ensure compatibility
3. Verify UI displays correctly with the new terminology
