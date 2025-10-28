import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// INSTRUCTIONS: Replace these placeholder values with your actual Firebase config
// You can find these values in: Firebase Console > Project Settings > Your apps > Web app config
//
// Note: These values are safe to commit to source control.
// Firebase security is enforced through Firebase Security Rules and authorized domains,
// not by hiding these configuration values.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;

