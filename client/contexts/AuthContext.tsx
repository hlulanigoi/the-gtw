import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rating: number;
  verified: boolean;
  emailVerified: boolean;
  createdAt: Date;
  savedLocationName?: string;
  savedLocationAddress?: string;
  savedLocationLat?: number;
  savedLocationLng?: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  googleLoading: boolean;
  pendingVerification: { email: string; name: string; password: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  setPendingVerification: (data: { email: string; name: string; password: string } | null) => void;
  completeSignUp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    name: string;
    password: string;
  } | null>(null);

  // Google Auth Request for Mobile
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Handle Mobile Google Auth Response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      
      setGoogleLoading(true);
      signInWithCredential(auth, credential)
        .then(async (result) => {
          const firebaseUser = result.user;
          const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (!profileDoc.exists()) {
            await setDoc(doc(db, "users", firebaseUser.uid), {
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              rating: 5.0,
              verified: false,
              emailVerified: true,
              createdAt: serverTimestamp(),
            });
          }
        })
        .catch((error) => {
          console.error("Google mobile sign-in error:", error);
        })
        .finally(() => {
          setGoogleLoading(false);
        });
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      const { signInWithPopup } = await import("firebase/auth");
      setGoogleLoading(true);
      try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!profileDoc.exists()) {
          await setDoc(doc(db, "users", firebaseUser.uid), {
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            rating: 5.0,
            verified: false,
            emailVerified: true,
            createdAt: serverTimestamp(),
          });
        }
      } catch (error: any) {
        console.error("Google web sign-in error:", error);
        if (error.code !== "auth/popup-closed-by-user") throw error;
      } finally {
        setGoogleLoading(false);
      }
    } else {
      if (request) {
        await promptAsync();
      } else {
        console.error("Google request not initialized");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profileDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setUserProfile({
            id: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || "",
            email: data.email || firebaseUser.email || "",
            phone: data.phone,
            rating: data.rating || 5.0,
            verified: data.verified || false,
            emailVerified: data.emailVerified || false,
            createdAt: data.createdAt?.toDate() || new Date(),
            savedLocationName: data.savedLocationName,
            savedLocationAddress: data.savedLocationAddress,
            savedLocationLat: data.savedLocationLat,
            savedLocationLng: data.savedLocationLng,
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string, isEmailVerified: boolean = false) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    await updateProfile(firebaseUser, { displayName: name });
    await setDoc(doc(db, "users", firebaseUser.uid), {
      name,
      email,
      rating: 5.0,
      verified: false,
      emailVerified: isEmailVerified,
      createdAt: serverTimestamp(),
    });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
    if (data.name) await updateProfile(user, { displayName: data.name });
    setUserProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  const sendVerificationCode = async (email: string) => {
    const code = generateVerificationCode();
    await setDoc(doc(db, "verificationCodes", email.toLowerCase()), {
      code,
      email: email.toLowerCase(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: serverTimestamp(),
    });
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    const codeDoc = await getDoc(doc(db, "verificationCodes", email.toLowerCase()));
    if (!codeDoc.exists()) return false;
    const data = codeDoc.data();
    if (new Date() > data.expiresAt.toDate() || data.code !== code) return false;
    await deleteDoc(doc(db, "verificationCodes", email.toLowerCase()));
    return true;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        googleLoading,
        pendingVerification,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        sendVerificationCode,
        verifyCode,
        resetPassword,
        setPendingVerification,
        completeSignUp: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
