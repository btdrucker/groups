# Groups - Word Puzzle Game

A React-based word puzzle game with Firebase authentication.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase Authentication:**
   
   This app uses Firebase for authentication (Google login and email/password).
   
   **Important:** You need to update the Firebase configuration before the app will work.
   
   See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.
   
   Quick steps:
   - Get your Firebase config from the Firebase Console
   - Update `src/firebase/config.ts` with your values
   - Enable Google and Email/Password authentication in Firebase Console
   - Add authorized domains (localhost and btdrucker.github.io)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

## Deployment

Deploy to GitHub Pages:
```bash
npm run deploy
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Firebase Authentication
- Redux Toolkit
- CSS Modules
