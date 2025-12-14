import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyD9pMTWieHyJ9z7qtg_BAKRZ8pqgNDnQiM",
  authDomain: "irgadgetsofficialweb.firebaseapp.com",
  projectId: "irgadgetsofficialweb",
  storageBucket: "irgadgetsofficialweb.firebasestorage.app",
  messagingSenderId: "855107386441",
  appId: "1:855107386441:web:d64c2fb26bd3056b3e5398",
  measurementId: "G-7TXF3ZWZCC"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
