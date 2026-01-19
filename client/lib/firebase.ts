import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, Auth, getReactNativePersistence } from "firebase/auth";
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

// Initialize Firebase App immediately
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase App initialization error:", error);
  throw error;
}

// Initialize Auth immediately based on platform
let authInstance: Auth;
try {
  if (Platform.OS === "web") {
    authInstance = getAuth(app);
  } else {
    // For React Native, use getReactNativePersistence with AsyncStorage
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error: any) {
      // If auth is already initialized, get the existing instance
      if (error.code === "auth/already-initialized") {
        authInstance = getAuth(app);
      } else {
        throw error;
      }
    }
  }
} catch (error) {
  console.error("Firebase Auth initialization error:", error);
  throw error;
}

// Initialize Firestore immediately
let dbInstance: Firestore;
try {
  dbInstance = getFirestore(app);
} catch (error) {
  console.error("Firebase Firestore initialization error:", error);
  throw error;
}

// Export the instances directly
export { app, authInstance as auth, dbInstance as db };
