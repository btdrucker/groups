# Quick Start: Adding Your Firebase Configuration

Follow these 3 simple steps to get authentication working:

## Step 1: Get Your Firebase Config

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → "Project settings"
4. Scroll down to "Your apps" section
5. Copy the `firebaseConfig` object

## Step 2: Update config.ts

Open `src/firebase/config.ts` and replace the placeholder values with your actual values from Step 1.

## Step 3: Enable Authentication

In Firebase Console:
1. Go to "Authentication" → "Sign-in method"
2. Enable "Google" 
3. Enable "Email/Password"
4. Go to "Settings" tab → "Authorized domains"
5. Make sure `localhost` and `btdrucker.github.io` are listed

That's it! Run `npm run dev` and test the login.

---

For more details, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

