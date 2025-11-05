import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from 'firebase/firestore';
import {db} from './config';

// Puzzle Interface
export interface Puzzle {
    id?: string;
    categories: string[];      // Array of 4 category names
    createdAt?: Timestamp;
    creatorId: string;
    words: string[];           // 4 arrays of 4 words each as a flat 16 element array
}

// Game State Interface
export interface GameState {
    id?: string;
    guesses: number[];           // Array of guesses represented by 16-bit numbers (one bit for each word)
    puzzleId: string;
    userId: string;
}

// Create a new puzzle
export const createPuzzle = async (puzzle: Omit<Puzzle, 'id' | 'creatorId' | 'createdAt'>, userId: string) => {
    try {
        const puzzleData = {
            ...puzzle,
            creatorId: userId,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'puzzles'), puzzleData);
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
        // Remove id from the update object
        const { id: _, ...updateData } = puzzle;
        await updateDoc(puzzleRef, updateData);
        return { id, error: null };
    } catch (error: any) {
        console.error('Error updating puzzle:', error);
        return { id: null, error: error.message };
    }
};

// Get puzzle-list created by a user
export const getUserPuzzles = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'puzzles'),
            where('creatorId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const puzzles: Puzzle[] = [];

        querySnapshot.forEach((doc) => {
            puzzles.push({id: doc.id, ...doc.data()} as Puzzle);
        });
        puzzles.sort((a, b) => (b?.createdAt?.toMillis() || 0) - (a?.createdAt?.toMillis() || 0));

        return {puzzles, error: null};
    } catch (error: any) {
        console.error('Error getting user puzzle-list:', error);
        return {puzzles: [], error: error.message};
    }
};

// Get a specific puzzle by ID
export const getPuzzle = async (puzzleId: string) => {
    try {
        const docRef = doc(db, 'puzzles', puzzleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {puzzle: {id: docSnap.id, ...docSnap.data()} as Puzzle, error: null};
        } else {
            return {puzzle: null, error: 'Puzzle not found'};
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
