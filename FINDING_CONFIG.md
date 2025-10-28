# Finding Your Firebase Configuration

## Visual Step-by-Step Guide

### 1. Open Firebase Console
Navigate to: https://console.firebase.google.com/

### 2. Select Your Project
Click on your existing Firebase project

### 3. Go to Project Settings
- Look for the gear icon ⚙️ next to "Project Overview" in the top left
- Click it
- Select "Project settings" from the dropdown

### 4. Scroll to "Your apps"
Scroll down the page until you see a section called "Your apps"

### 5. Get Your Config

**If you already have a web app:**
- You'll see a section with `</> Firebase SDK snippet`
- Click "Config" radio button
- Copy the `firebaseConfig` object

**If you DON'T have a web app yet:**
- Click the `</>` (web) icon to add a web app
- Give it a nickname (e.g., "Groups App")
- Click "Register app"
- Copy the `firebaseConfig` object from the code shown

Your config will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA...",              // Starts with AIzaSy
  authDomain: "yourproject.firebaseapp.com",
  projectId: "yourproject",
  storageBucket: "yourproject.appspot.com",
  messagingSenderId: "123456789012",  // Numbers only
  appId: "1:123456789:web:abc123"    // Starts with 1:
};
```

### 6. Copy to Your Project

1. Open `src/firebase/config.ts` in your code editor
2. Replace **only the values** (keep the keys the same):
   - Replace `"YOUR_API_KEY_HERE"` with your actual `apiKey`
   - Replace `"YOUR_PROJECT_ID.firebaseapp.com"` with your `authDomain`
   - Replace all instances of `"YOUR_PROJECT_ID"` with your `projectId`
   - Replace `"YOUR_MESSAGING_SENDER_ID"` with your `messagingSenderId`
   - Replace `"YOUR_APP_ID"` with your `appId`

### 7. Don't Forget to Enable Auth Methods!

After updating the config:
1. Go back to Firebase Console
2. Click "Authentication" in the left sidebar
3. Click "Sign-in method" tab
4. Enable "Google" and "Email/Password"

That's it! Run `npm run dev` and test your login! 🚀

---

## ⚠️ Common Mistakes

❌ **Don't** commit without replacing the placeholder values  
❌ **Don't** add quotes around numbers (messagingSenderId should be a string, but copied as-is)  
❌ **Don't** forget to enable auth methods in Firebase Console  
❌ **Don't** forget to add your domain to authorized domains  

✅ **Do** copy values exactly as shown in Firebase Console  
✅ **Do** keep the config values in source control (they're public)  
✅ **Do** enable both Google and Email/Password authentication  
✅ **Do** test locally before deploying  

---

## 🔍 Troubleshooting

**"Firebase: Error (auth/invalid-api-key)"**
→ Your API key is incorrect. Double-check the `apiKey` value.

**"Firebase: Error (auth/auth-domain-config-required)"**
→ Your `authDomain` is incorrect or missing.

**"Firebase: Error (auth/configuration-not-found)"**
→ Your `projectId` doesn't match your Firebase project.

**"Firebase: Error (auth/unauthorized-domain)"**
→ Add your domain to authorized domains in Firebase Console.

**"Firebase: This operation is not allowed"**
→ You haven't enabled the auth method in Firebase Console.

---

Need more help? See **FIREBASE_SETUP.md** for detailed instructions!

