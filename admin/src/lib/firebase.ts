import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCrQ0QJLvx-qnFqLqQ2Q0Q2Q0Q2Q0Q2Q0Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'parcelpeer.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'parcelpeer',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'parcelpeer.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
