import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  Auth
} from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  // Use a reliable initialization pattern for React Native
  // Cast to any to access getReactNativePersistence safely across environments
  const getRNPersistence = (firebaseAuth as any).getReactNativePersistence;
  try {
    if (getRNPersistence) {
      console.log('Initializing Firebase Auth with React Native Persistence');
      auth = initializeAuth(app, {
        persistence: getRNPersistence(ReactNativeAsyncStorage),
      });
    } else {
      console.warn('getReactNativePersistence not found, falling back to getAuth');
      auth = getAuth(app);
    }
  } catch (e) {
    // Fallback if initializeAuth fails (e.g. if already initialized)
    console.log('Firebase Auth initialization caught error:', e);
    auth = getAuth(app);
  }
}

// Log auth state for debugging
console.log('Firebase Auth initialized:', !!auth);
if (auth) {
  console.log('Current Platform:', Platform.OS);
}

export { app, auth };
export default app;
