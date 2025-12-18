import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import {db} from './config';

// Puzzle Interface
export interface Puzzle {
    id?: string;
    categories: string[];      // Array of `numGroups` group names (stored as 'categories' in Firestore)
    createdAt?: number;        // Timestamp milliseconds
    creatorId: string;
    creatorName: string;       // Display name of the creator
    words: string[];           // `numGroups` arrays of `wordsPerGroup` words each as a single flat array
    numGroups: number;         // Number of groups (required after migration)
    wordsPerGroup: number;     // Number of words per group (required after migration)
}

// Game State Interface
export interface GameState {
    id?: string;
    guesses: number[];         // Array of guesses represented by 16-bit numbers (one bit for each word)
    puzzleId: string;
    userId: string;
    // Denormalized puzzle metadata for efficient list display (required after migration)
    creatorName: string;
    createdAt: number;
    numGroups: number;
    wordsPerGroup: number;
}

// Create a new puzzle
export const createPuzzle = async (puzzle: Puzzle) => {
    try {
        const {id: _, ...puzzleWithoutId} = puzzle;
        const puzzleDoc = {
            ...puzzleWithoutId,
            createdAt: serverTimestamp()
        }

        const docRef = await addDoc(collection(db, 'puzzles'), puzzleDoc);
        return {id: docRef.id, error: null};
    } catch (error: any) {
        console.error('Error creating puzzle:', error);
        return {id: null, error: error.message};
    }
};

// Update an existing puzzle by id
export const updatePuzzle = async (puzzle: Puzzle) => {
    try {
        const id = puzzle.id!;
        const puzzleRef = doc(db, 'puzzles', id);

        const {id: _, ...puzzleWithoutId} = puzzle;
        const puzzleDoc = {
            ...puzzleWithoutId,
            createdAt: serverTimestamp()
        }

        await updateDoc(puzzleRef, puzzleDoc);
        return { id, error: null };
    } catch (error: any) {
        console.error('Error updating puzzle:', error);
        return { id: null, error: error.message };
    }
};

// Get compose-list created by a user
export const getUserPuzzles = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'puzzles'),
            where('creatorId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const puzzles: Puzzle[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            puzzles.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis()
            } as Puzzle);
        });
        puzzles.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));

        return {puzzles, error: null};
    } catch (error: any) {
        console.error('Error getting user compose-list:', error);
        return {puzzles: [], error: error.message};
    }
};

export const PUZZLE_NOT_FOUND = 'Puzzle not found';

// Get a specific puzzle by ID
export const getPuzzle = async (puzzleId: string) => {
    try {
        const docRef = doc(db, 'puzzles', puzzleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {puzzle: {
                id: docSnap.id,
                ...data,
                createdAt: data.createdAt?.toMillis()
            } as Puzzle, error: null};
        } else {
            return {puzzle: null, error: PUZZLE_NOT_FOUND};
        }
    } catch (error: any) {
        console.error('Error getting puzzle:', error);
        return {puzzle: null, error: error.message};
    }
};

// Create or update game state
export const saveGameState = async (gameState: Omit<GameState, 'id'>) => {
    try {
        // First, check if a game state already exists for this user/puzzle combination
        const q = query(
            collection(db, 'gameStates'),
            where('userId', '==', gameState.userId),
            where('puzzleId', '==', gameState.puzzleId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Update existing game state
            const existingDocId = querySnapshot.docs[0].id;
            const docRef = doc(db, 'gameStates', existingDocId);

            await updateDoc(docRef, {
                guesses: gameState.guesses,
            });

            return {id: existingDocId, error: null};
        } else {
            // Create new game state
            const gameStateData = {
                ...gameState,
            };

            const docRef = await addDoc(collection(db, 'gameStates'), gameStateData);
            return {id: docRef.id, error: null};
        }
    } catch (error: any) {
        console.error('Error saving game state:', error);
        return {id: null, error: error.message};
    }
};

// Get user's game state for a specific puzzle
export const getGameState = async (userId: string, puzzleId: string) => {
    try {
        const q = query(
            collection(db, 'gameStates'),
            where('userId', '==', userId),
            where('puzzleId', '==', puzzleId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {gameState: {id: doc.id, ...doc.data()} as GameState, error: null};
        }

        return {gameState: null, error: null};
    } catch (error: any) {
        console.error('Error getting game state:', error);
        return {gameState: null, error: error.message};
    }
};

// Get all game states for a user
export const getUserGameStates = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'gameStates'),
            where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const gameStates: GameState[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            gameStates.push({
                id: doc.id,
                ...data,
            } as GameState);
        });

        return {gameStates, error: null};
    } catch (error: any) {
        console.error('Error getting user game states:', error);
        return {gameStates: [], error: error.message};
    }
};

// Delete a puzzle by id
export const deletePuzzle = async (puzzleId: string) => {
    try {
        const puzzleRef = doc(db, 'puzzles', puzzleId);
        await deleteDoc(puzzleRef);
        return { error: null };
    } catch (error: any) {
        console.error('Error deleting puzzle:', error);
        return { error: error.message };
    }
}
