import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// @ts-ignore - getReactNativePersistence exists at runtime but TypeScript types lag behind
const { getReactNativePersistence } = require("firebase/auth");

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: any) {
    if (error.code === "auth/already-initialized") {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

const db = getFirestore(app);

export { app, auth, db };
