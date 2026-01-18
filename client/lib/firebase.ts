import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth,
  browserSessionPersistence,
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
  try {
    // Firebase v10.x+ often exports this through the main entry point or a subpath
    // We try to access it dynamically to avoid resolution issues during bundling
    const getRNPersistence = (firebaseAuth as any).getReactNativePersistence;
    
    if (getRNPersistence) {
      auth = initializeAuth(app, {
        persistence: getRNPersistence(ReactNativeAsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }
  } catch (e) {
    auth = getAuth(app);
  }
}

export { app, auth };
export default app;
