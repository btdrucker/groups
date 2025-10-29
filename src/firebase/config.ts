import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import { validateFirebaseConfig } from './validateConfig';

// Firebase configuration
// INSTRUCTIONS: Replace these placeholder values with your actual Firebase config
// See FIREBASE_SETUP.md for detailed setup instructions
//
// To get these values:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project
// 3. Go to Project Settings (gear icon) > General
// 4. Scroll to "Your apps" and copy the config object
//
// Note: These values are SAFE to commit to source control.
// Firebase security is enforced through Security Rules and authorized domains.

const firebaseConfig = {
    apiKey: "AIzaSyDSbsdRJTzetHUIsAnefv1N6zPaPIfhRt0",
    authDomain: "group-game-3f364.firebaseapp.com",
    projectId: "group-game-3f364",
    storageBucket: "group-game-3f364.firebasestorage.app",
    messagingSenderId: "377863220527",
    appId: "1:377863220527:web:4300b563d9685c53e2c5da",
    measurementId: "G-SBYB7B4KLJ"
};

// Validate configuration (logs helpful error if not set up)
validateFirebaseConfig(firebaseConfig);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

