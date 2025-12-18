import {
    collection,
    getDocs,
    addDoc,
} from 'firebase/firestore';
import { db } from './config';
import { GameState, Puzzle, PuzzlePlayerStats, StatsStatus } from './firestore';

/**
 * Migration script to backfill puzzlePlayerStats from existing game states
 *
 * This script:
 * 1. Fetches all game states
 * 2. For each game state, determines the game status (WIP/WON/LOST) and groups solved
 * 3. Creates a corresponding puzzlePlayerStats document if one doesn't already exist
 *
 * Run this once to backfill historical player stats.
 *
 * IMPORTANT: Running this migration from the client
 * --------------------------------------------------
 * The current Firestore rules only allow users to create stats documents for themselves.
 * To run this migration, you have TWO OPTIONS:
 *
 * Option 1: Temporarily relax Firestore rules (RECOMMENDED for quick migration)
 *    - Before migration: Add this rule to puzzlePlayerStats in firestore.rules:
 *      allow create: if request.auth != null;
 *    - Deploy rules: firebase deploy --only firestore:rules
 *    - Run migration: npm run migrate
 *    - After migration: Restore the original rule:
 *      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
 *    - Deploy rules again: firebase deploy --only firestore:rules
 *
 * Option 2: Run as admin using Firebase Admin SDK (server-side)
 *    - This requires setting up a Node.js script with Firebase Admin SDK
 *    - Not practical for client-side apps
 */

interface MigrationResult {
    success: boolean;
    statsCreated: number;
    errors: string[];
}

/**
 * Helper function to count the number of set bits in a number
 */
const countSetBits = (n: number): number => {
    let count = 0;
    while (n) {
        if (n & 1) count++;
        n >>= 1;
    }
    return count;
};

/**
 * Returns the number of correct words in a specified group for a given guess
 */
const numCorrectWordsForGroup = (guessNumber: number, groupIndex: number, wordsInGroup: number): number => {
    const groupMask = ((1 << wordsInGroup) - 1) << (groupIndex * wordsInGroup);
    const guessMasked = guessNumber & groupMask;
    return countSetBits(guessMasked);
};

/**
 * Checks if a guess matches a specified group
 */
const isGuessCorrect = (guessNumber: number, groupIndex: number, wordsPerGroup: number): boolean => {
    return numCorrectWordsForGroup(guessNumber, groupIndex, wordsPerGroup) === wordsPerGroup;
};

/**
 * Calculate which groups were solved from guesses
 */
const calculateGroupsSolved = (guesses: number[], numGroups: number, wordsPerGroup: number): number[] => {
    const groupsSolved: number[] = [];

    for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        const isGroupSolved = guesses.some(guessNumber =>
            isGuessCorrect(guessNumber, groupIndex, wordsPerGroup)
        );

        if (isGroupSolved) {
            groupsSolved.push(groupIndex);
        }
    }

    return groupsSolved;
};

/**
 * Determine game status from game state and puzzle
 */
const determineGameStatus = (
    gameState: GameState,
    puzzle: Puzzle
): { status: StatsStatus; groupsSolved: number[] } => {
    const { guesses } = gameState;
    const { numGroups, wordsPerGroup } = puzzle;

    const groupsSolved = calculateGroupsSolved(guesses, numGroups, wordsPerGroup);

    // Check if all groups are solved (game won)
    if (groupsSolved.length === numGroups) {
        return { status: StatsStatus.WON, groupsSolved };
    }

    // Calculate mistakes to determine if game is lost
    const mistakeCount = guesses.filter((guessNumber: number) => {
        // Count incorrect guesses (guesses that don't match any group)
        for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
            if (isGuessCorrect(guessNumber, groupIndex, wordsPerGroup)) {
                return false; // This was a correct guess
            }
        }
        return true; // This was an incorrect guess
    }).length;

    const availableMistakes = numGroups;
    const mistakesRemaining = Math.max(0, availableMistakes - mistakeCount);

    // If no mistakes remaining and not all groups solved, game is lost
    if (mistakesRemaining === 0) {
        return { status: StatsStatus.LOST, groupsSolved };
    }

    // Otherwise, game is still in progress
    return { status: StatsStatus.WIP, groupsSolved };
};

/**
 * Main migration function to backfill puzzlePlayerStats
 */
export const migratePuzzlePlayerStats = async (): Promise<MigrationResult> => {
    console.log('Starting puzzlePlayerStats migration...');
    const errors: string[] = [];
    let statsCreated = 0;

    try {
        // Step 1: Load all puzzles for reference
        const puzzlesRef = collection(db, 'puzzles');
        const puzzlesSnapshot = await getDocs(puzzlesRef);
        const puzzleMap = new Map<string, Puzzle>();

        puzzlesSnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            puzzleMap.set(docSnapshot.id, {
                id: docSnapshot.id,
                ...data,
                createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
                numGroups: data.numGroups ?? 4,
                wordsPerGroup: data.wordsPerGroup ?? 4,
            } as Puzzle);
        });

        console.log(`Loaded ${puzzleMap.size} puzzles for lookup`);

        // Step 2: Load all existing puzzlePlayerStats to avoid duplicates
        const statsRef = collection(db, 'puzzlePlayerStats');
        const existingStatsSnapshot = await getDocs(statsRef);
        const existingStatsSet = new Set<string>();

        existingStatsSnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data() as PuzzlePlayerStats;
            const key = `${data.puzzleId}:${data.userId}`;
            existingStatsSet.add(key);
        });

        console.log(`Found ${existingStatsSet.size} existing puzzlePlayerStats documents`);

        // Step 3: Process all game states
        const gameStatesRef = collection(db, 'gameStates');
        const gameStatesSnapshot = await getDocs(gameStatesRef);

        console.log(`Found ${gameStatesSnapshot.size} game states to process`);

        for (const docSnapshot of gameStatesSnapshot.docs) {
            const gameState = docSnapshot.data() as GameState;
            const { puzzleId, userId } = gameState;
            const statsKey = `${puzzleId}:${userId}`;

            // Skip if stats already exist for this puzzle-user combination
            if (existingStatsSet.has(statsKey)) {
                continue;
            }

            // Get the corresponding puzzle
            const puzzle = puzzleMap.get(puzzleId);
            if (!puzzle) {
                const errorMsg = `Game state ${docSnapshot.id} references missing puzzle ${puzzleId}`;
                console.warn(errorMsg);
                errors.push(errorMsg);
                continue;
            }

            // Determine game status and groups solved
            const { status, groupsSolved } = determineGameStatus(gameState, puzzle);

            // We need the userName - try to get it from the game state or use a placeholder
            // Note: Game states don't have userName, so we'll use 'Unknown Player' as a placeholder
            const userName = 'Unknown Player';

            // Create the puzzlePlayerStats document
            const statsData: PuzzlePlayerStats = {
                puzzleId,
                userId,
                userName,
                status,
                groupsSolved,
                lastUpdated: Date.now(),
            };

            try {
                await addDoc(statsRef, statsData);
                statsCreated++;
                existingStatsSet.add(statsKey); // Mark as created to avoid duplicates

                if (statsCreated % 50 === 0) {
                    console.log(`Created ${statsCreated} puzzlePlayerStats documents so far...`);
                }
            } catch (error: any) {
                const errorMsg = `Failed to create stats for puzzle ${puzzleId}, user ${userId}: ${error.message}`;
                console.error(errorMsg);
                errors.push(errorMsg);
            }
        }

        console.log(`✓ PuzzlePlayerStats migration complete. Created ${statsCreated} documents.`);
        return { statsCreated, errors, success: true };
    } catch (error: any) {
        const errorMsg = `PuzzlePlayerStats migration failed: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        return { statsCreated, errors, success: false };
    }
};

/**
 * Run the complete migration
 */
export const runMigration = async (): Promise<MigrationResult> => {
    console.log('='.repeat(60));
    console.log('Starting PuzzlePlayerStats Migration');
    console.log('='.repeat(60));

    const startTime = Date.now();

    const result = await migratePuzzlePlayerStats();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('='.repeat(60));
    console.log('Migration Complete');
    console.log(`Duration: ${duration}s`);
    console.log(`Stats created: ${result.statsCreated}`);
    console.log(`Total errors: ${result.errors.length}`);
    console.log('='.repeat(60));

    if (result.errors.length > 0) {
        console.error('Errors encountered:');
        result.errors.forEach((error, index) => {
            console.error(`${index + 1}. ${error}`);
        });
    }

    return result;
};
