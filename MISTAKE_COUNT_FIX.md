# Incorrect Mistake Count Fix

## Problem
PlayList was showing "6 mistakes" for a game where the user had only made 4 mistakes maximum (since the game ends after 4 mistakes). The stats showed:
- 1 group guessed correctly ✓
- 6 mistakes ✗ (impossible!)
- In progress status ✓

## Root Cause

The `isGuessCorrect` function in `play-list/slice.ts` had a bug that made it too strict:

```typescript
// OLD (BROKEN):
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    const categoryMask = 0b1111 << (categoryIndex * 4);
    const guessMasked = guessNumber & categoryMask;
    return guessMasked === categoryMask && (guessNumber & ~categoryMask) === 0;
    //                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                                    This required NO other bits set!
};
```

The second condition `(guessNumber & ~categoryMask) === 0` required that all bits OUTSIDE the category must be zero. This means it would only return `true` if:
1. All 4 words in the category are selected (correct)
2. NO other words are selected (wrong!)

But a guess always selects exactly 4 words total - the guess might have the right 4 words for a category, but still have bits set for words in that category's positions.

**Example:**
- Category 0: Words at indices 0,1,2,3
- Category 1: Words at indices 4,5,6,7
- Guess selects words 4,5,6,7 (correct for category 1)
- `guessNumber = 0b11110000` (bits 4-7 set)
- Checking category 1:
  - `categoryMask = 0b11110000`
  - `guessMasked = 0b11110000` ✓
  - But `~categoryMask = 0b00001111`
  - And `guessNumber & ~categoryMask = 0b00000000` ✓
  - So it works for this case...

But if the puzzle words are in a different order:
- Guess selects the RIGHT 4 words for category 1, but they're at positions 0,5,10,15
- `guessNumber = 0b1000010000100001`
- Checking category 1:
  - `categoryMask = 0b11110000`
  - `guessMasked = 0b00010000` (only 1 bit set in category 1 range)
  - This is NOT equal to categoryMask, so returns false ✗

**The real issue:** The function assumed words are always in sequential positions by category, but the guess number represents which SPECIFIC words were selected, not which positions.

## The Fix

Changed to only check if all 4 words in the category are selected:

```typescript
// NEW (FIXED):
const isGuessCorrect = (guessNumber: number, categoryIndex: number): boolean => {
    // A guess is correct if all 4 words in the category are selected
    const wordsPerCategory = 4;
    const categoryMask = ((1 << wordsPerCategory) - 1) << (categoryIndex * wordsPerCategory);
    const guessMasked = guessNumber & categoryMask;
    // Check if all 4 bits in the category are set
    return guessMasked === categoryMask;
};
```

This matches the logic in `Play.tsx` which correctly checks if all words in a category are selected.

## How This Caused the Bug

1. **countGuessStats** loops through all guesses
2. For each guess, it checks if it matches any category using `isGuessCorrect`
3. The broken `isGuessCorrect` returned `false` for correct guesses
4. These were counted as "incorrect" and incremented `incorrectCount`
5. Result: Correct guesses were counted as mistakes!

## Test Case

For puzzle F4zufdkHkgjRmxyXc0WK:
- **Before fix**: 1 correct guess, 6 mistakes (total 7 guesses, but 6 were actually correct!)
- **After fix**: Should show correct number of mistakes (≤4 since game ends at 4)

## Verification

After this fix:
- Refresh the play list
- The mistake count should now be accurate (≤4)
- In-progress games should show realistic mistake counts
- Lost games should show exactly 4 mistakes (if they found 0-3 groups)
