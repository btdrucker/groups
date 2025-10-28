# Firebase Setup Instructions

This app uses Firebase Authentication for Google login and email/password authentication.

## Step 1: Get Your Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project (or create a new one)
3. Click on the gear icon ⚙️ next to "Project Overview" and select "Project settings"
4. Scroll down to "Your apps" section
5. If you don't have a web app yet, click "Add app" and select the web icon `</>`
6. Copy your Firebase configuration object

## Step 2: Update the Firebase Config File

Open `src/firebase/config.ts` and replace the placeholder values with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 3: Enable Authentication Methods in Firebase

1. In the Firebase Console, go to "Authentication" in the left sidebar
2. Click on the "Sign-in method" tab
3. Enable the following sign-in methods:
   - **Google**: Click on Google, toggle "Enable", and save
   - **Email/Password**: Click on Email/Password, toggle "Enable", and save

## Step 4: Configure Authorized Domains

1. In the Authentication section, go to the "Settings" tab
2. Under "Authorized domains", make sure the following are added:
   - `localhost` (for local development)
   - Your GitHub Pages domain: `btdrucker.github.io` (for production)

## Important Notes

### Security

The Firebase configuration values (API keys, project IDs, etc.) are **safe to commit to source control**. These are not secret keys. Firebase's security is enforced through:

1. **Firebase Security Rules** - Control access to your data
2. **Authorized domains** - Only allow authentication from specified domains
3. **API key restrictions** (optional) - Can be configured in Google Cloud Console

### No Environment Variables Required

This setup intentionally **does not use environment variables** because:

- Firebase client-side config is public by design
- Anyone can see these values in your deployed app's network requests
- Security is handled by Firebase on the backend
- This makes it easier for collaborators to run the app without setting up environment variables

### For Production

When deploying to GitHub Pages:
1. Make sure `btdrucker.github.io` is in your authorized domains
2. The authentication will work automatically
3. No additional deployment configuration needed

### Testing

To test the authentication:
1. Run `npm run dev`
2. Click "Sign in with Google" to test Google authentication
3. Or use the email/password fields to create an account and sign in

