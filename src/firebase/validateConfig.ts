// Utility to help validate Firebase configuration
// This will log helpful messages if the config hasn't been set up yet

const PLACEHOLDER_VALUES = [
  'YOUR_API_KEY_HERE',
  'YOUR_PROJECT_ID',
  'YOUR_MESSAGING_SENDER_ID',
  'YOUR_APP_ID'
];

export const validateFirebaseConfig = (config: any): boolean => {
  const configString = JSON.stringify(config);

  const hasPlaceholders = PLACEHOLDER_VALUES.some(placeholder =>
    configString.includes(placeholder)
  );

  if (hasPlaceholders) {
    console.error(
      '🔥 Firebase Configuration Not Set Up! 🔥\n\n' +
      'You need to configure Firebase before authentication will work.\n\n' +
      'Quick steps:\n' +
      '1. Get your Firebase config from: https://console.firebase.google.com/\n' +
      '2. Update src/firebase/config.ts with your values\n' +
      '3. Enable Google and Email/Password auth in Firebase Console\n\n' +
      'See QUICKSTART.md for detailed instructions.'
    );
    return false;
  }

  return true;
};

