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
  // Use getAuth first to register the component before initializing with persistence
  // We access getReactNativePersistence from the subpath if needed, or through any cast
  // to avoid strict type errors while ensuring the registration order is correct.
  auth = getAuth(app);
  try {
    const getRNPersistence = (firebaseAuth as any).getReactNativePersistence;
    
    if (getRNPersistence) {
      // Re-initialize with persistence if available
      auth = initializeAuth(app, {
        persistence: getRNPersistence(ReactNativeAsyncStorage),
      });
    }
  } catch (e) {
    // If already initialized or failed, auth is already set via getAuth(app)
  }
}

export { app, auth };
export default app;
