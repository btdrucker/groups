import {
    collection,
    getDocs,
    doc,
    updateDoc,
    writeBatch,
    query,
} from 'firebase/firestore';
import { db } from './config';
import { Puzzle, GameState } from './firestore';

/**
 * Migration script to add missing fields to Puzzles and GameStates
 *
 * This script:
 * 1. Adds numGroups and wordsPerGroup fields to all puzzles (defaults to 4)
 * 2. Adds denormalized puzzle metadata (creatorName, createdAt, numGroups) to all game states
 *
 * Run this once to backfill existing data.
 *
 * Firestore Rules Required:
 * - You need write access to both 'puzzles' and 'gameStates' collections
 * - If running from client-side, ensure your Firebase rules allow updates to these collections
 * - Recommended: Run this as an admin/server-side script or temporarily relax rules
 */

interface MigrationResult {
    success: boolean;
    puzzlesUpdated: number;
    gameStatesUpdated: number;
    errors: string[];
}

/**
 * Step 1: Migrate all puzzles to include numGroups and wordsPerGroup
 */
export const migratePuzzles = async (): Promise<{ updated: number; errors: string[] }> => {
    console.log('Starting puzzle migration...');
    const errors: string[] = [];
    let updated = 0;

    try {
        const puzzlesRef = collection(db, 'puzzles');
        const snapshot = await getDocs(puzzlesRef);

        console.log(`Found ${snapshot.size} puzzles to check`);

        // Use batched writes for efficiency (max 500 operations per batch)
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data() as Puzzle;
            const needsUpdate = !data.numGroups || !data.wordsPerGroup;

            if (needsUpdate) {
                const puzzleRef = doc(db, 'puzzles', docSnapshot.id);
                const updates: Partial<Puzzle> = {};

                if (!data.numGroups) {
                    updates.numGroups = 4;
                }
                if (!data.wordsPerGroup) {
                    updates.wordsPerGroup = 4;
                }

                batch.update(puzzleRef, updates);
                operationCount++;
                updated++;

                // Commit batch every 500 operations
                if (operationCount >= 500) {
                    await batch.commit();
                    console.log(`Committed batch of ${operationCount} puzzle updates`);
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            }
        }

        // Commit remaining operations
        if (operationCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${operationCount} puzzle updates`);
        }

        console.log(`✓ Puzzle migration complete. Updated ${updated} puzzles.`);
        return { updated, errors };
    } catch (error: any) {
        const errorMsg = `Puzzle migration failed: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        return { updated, errors };
    }
};

/**
 * Step 2: Migrate all game states to include denormalized puzzle metadata
 */
export const migrateGameStates = async (): Promise<{ updated: number; errors: string[] }> => {
    console.log('Starting game state migration...');
    const errors: string[] = [];
    let updated = 0;

    try {
        // First, load all puzzles into memory for lookup
        const puzzlesRef = collection(db, 'puzzles');
        const puzzlesSnapshot = await getDocs(puzzlesRef);
        const puzzleMap = new Map<string, Puzzle>();

        puzzlesSnapshot.forEach((doc) => {
            const data = doc.data();
            puzzleMap.set(doc.id, {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis?.() ?? data.createdAt,
                numGroups: data.numGroups ?? 4,
                wordsPerGroup: data.wordsPerGroup ?? 4,
            } as Puzzle);
        });

        console.log(`Loaded ${puzzleMap.size} puzzles for lookup`);

        // Now process all game states
        const gameStatesRef = collection(db, 'gameStates');
        const gameStatesSnapshot = await getDocs(gameStatesRef);

        console.log(`Found ${gameStatesSnapshot.size} game states to check`);

        // Use batched writes for efficiency
        let batch = writeBatch(db);
        let operationCount = 0;

        for (const docSnapshot of gameStatesSnapshot.docs) {
            const data = docSnapshot.data() as GameState;
            const needsUpdate = !data.creatorName || !data.createdAt || !data.numGroups || !data.wordsPerGroup;

            if (needsUpdate) {
                const puzzle = puzzleMap.get(data.puzzleId);

                if (!puzzle) {
                    const errorMsg = `Game state ${docSnapshot.id} references missing puzzle ${data.puzzleId}`;
                    console.warn(errorMsg);
                    errors.push(errorMsg);
                    continue;
                }

                const gameStateRef = doc(db, 'gameStates', docSnapshot.id);
                const updates: Partial<GameState> = {};

                if (!data.creatorName) {
                    updates.creatorName = puzzle.creatorName;
                }
                if (!data.createdAt) {
                    updates.createdAt = puzzle.createdAt;
                }
                if (!data.numGroups) {
                    updates.numGroups = puzzle.numGroups ?? 4;
                }
                if (!data.wordsPerGroup) {
                    updates.wordsPerGroup = puzzle.wordsPerGroup ?? 4;
                }

                batch.update(gameStateRef, updates);
                operationCount++;
                updated++;

                // Commit batch every 500 operations
                if (operationCount >= 500) {
                    await batch.commit();
                    console.log(`Committed batch of ${operationCount} game state updates`);
                    batch = writeBatch(db);
                    operationCount = 0;
                }
            }
        }

        // Commit remaining operations
        if (operationCount > 0) {
            await batch.commit();
            console.log(`Committed final batch of ${operationCount} game state updates`);
        }

        console.log(`✓ Game state migration complete. Updated ${updated} game states.`);
        return { updated, errors };
    } catch (error: any) {
        const errorMsg = `Game state migration failed: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        return { updated, errors };
    }
};

/**
 * Run the complete migration
 */
export const runMigration = async (): Promise<MigrationResult> => {
    console.log('='.repeat(60));
    console.log('Starting Database Migration');
    console.log('='.repeat(60));

    const startTime = Date.now();

    // Step 1: Migrate puzzles
    const puzzleResult = await migratePuzzles();

    // Step 2: Migrate game states
    const gameStateResult = await migrateGameStates();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('='.repeat(60));
    console.log('Migration Complete');
    console.log(`Duration: ${duration}s`);
    console.log(`Puzzles updated: ${puzzleResult.updated}`);
    console.log(`Game states updated: ${gameStateResult.updated}`);
    console.log(`Total errors: ${puzzleResult.errors.length + gameStateResult.errors.length}`);
    console.log('='.repeat(60));

    const allErrors = [...puzzleResult.errors, ...gameStateResult.errors];
    if (allErrors.length > 0) {
        console.error('Errors encountered:');
        allErrors.forEach((error, index) => {
            console.error(`${index + 1}. ${error}`);
        });
    }

    return {
        success: allErrors.length === 0,
        puzzlesUpdated: puzzleResult.updated,
        gameStatesUpdated: gameStateResult.updated,
        errors: allErrors,
    };
};
