import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
let app: FirebaseApp;
function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

// Lazy initialization for Auth
let authInstance: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const firebaseApp = getFirebaseApp();

  if (Platform.OS === "web") {
    authInstance = getAuth(firebaseApp);
  } else {
    try {
      // For React Native, we need to use getReactNativePersistence
      // Import it dynamically to avoid TypeScript issues
      const { getReactNativePersistence } = require("firebase/auth");
      
      authInstance = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error: any) {
      // If auth is already initialized, get the existing instance
      if (error.code === "auth/already-initialized") {
        authInstance = getAuth(firebaseApp);
      } else {
        console.error("Firebase Auth initialization error:", error);
        throw error;
      }
    }
  }

  return authInstance;
}

// Lazy initialization for Firestore
let dbInstance: Firestore | null = null;

function getFirebaseFirestore(): Firestore {
  if (!dbInstance) {
    const firebaseApp = getFirebaseApp();
    dbInstance = getFirestore(firebaseApp);
  }
  return dbInstance;
}

// Export the getter functions and app
export { getFirebaseApp as app, getFirebaseAuth as auth, getFirebaseFirestore as db };
