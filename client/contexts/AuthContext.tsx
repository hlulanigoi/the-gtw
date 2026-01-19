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
import { auth as getAuth } from "@/lib/firebase";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { apiRequest } from "@/lib/query-client";

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
  walletBalance: number;
  subscriptionStatus: "free" | "premium";
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

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.includes(":") 
      ? undefined
      : "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
    webClientId: "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
    iosClientId: "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
    androidClientId: "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
    scopes: ["profile", "email"],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token, access_token } = response.params;
      
      (async () => {
        try {
          const credential = GoogleAuthProvider.credential(id_token, access_token);
          const result = await signInWithCredential(getAuth(), credential);
          const firebaseUser = result.user;
          
          // Sync user to PostgreSQL
          try {
            await apiRequest("POST", "/api/users", {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              rating: 5.0,
              verified: false,
              emailVerified: true,
              walletBalance: 0,
              subscriptionStatus: "free",
            });
          } catch (dbError: any) {
            // User may already exist, that's okay
            if (!dbError?.message?.includes("already exists")) {
              console.error("Error syncing user to DB:", dbError);
            }
          }
          setGoogleLoading(false);
        } catch (error: any) {
          console.error("Error signing in with Google:", error);
          setGoogleLoading(false);
        }
      })();
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      const { signInWithPopup } = await import("firebase/auth");
      setGoogleLoading(true);
      try {
        const result = await signInWithPopup(getAuth(), provider);
        const firebaseUser = result.user;
        
        // Sync user to PostgreSQL
        try {
          await apiRequest("POST", "/api/users", {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            rating: 5.0,
            verified: false,
            emailVerified: true,
            walletBalance: 0,
            subscriptionStatus: "free",
          });
        } catch (dbError: any) {
          // User may already exist, that's okay
          if (!dbError?.message?.includes("already exists")) {
            console.error("Error syncing user to DB:", dbError);
          }
        }
      } catch (error: any) {
        console.error("Google sign-in error:", error);
        if (error.code === "auth/popup-closed-by-user") {
          return;
        }
        throw error;
      } finally {
        setGoogleLoading(false);
      }
    } else {
      setGoogleLoading(true);
      try {
        await WebBrowser.warmUpAsync();
        const result = await promptAsync();
        if (result?.type !== "success") {
          throw new Error("Google sign-in was cancelled. Please try again or use email sign-in.");
        }
      } catch (error: any) {
        console.error("Native Google sign-in error:", error);
        setGoogleLoading(false);
        throw new Error("Google Sign-In failed. Please use email/password or try again.");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const response = await apiRequest("GET", `/api/users/${firebaseUser.uid}`);
          const data = response as any;
          setUserProfile({
            id: firebaseUser.uid,
            name: data.name || firebaseUser.displayName || "",
            email: data.email || firebaseUser.email || "",
            phone: data.phone,
            rating: data.rating || 5.0,
            verified: data.verified || false,
            emailVerified: data.emailVerified || false,
            createdAt: new Date(data.createdAt),
            savedLocationName: data.savedLocationName,
            savedLocationAddress: data.savedLocationAddress,
            savedLocationLat: data.savedLocationLat,
            savedLocationLng: data.savedLocationLng,
            walletBalance: data.walletBalance || 0,
            subscriptionStatus: data.subscriptionStatus || "free",
          });
        } catch (error: any) {
          // If user doesn't exist in DB, create them
          if (error?.message?.includes("404")) {
            try {
              await apiRequest("POST", "/api/users", {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || "",
                email: firebaseUser.email || "",
                rating: 5.0,
                verified: false,
                emailVerified: firebaseUser.emailVerified || false,
                walletBalance: 0,
                subscriptionStatus: "free",
              });
              // Fetch again after creating
              const response = await apiRequest("GET", `/api/users/${firebaseUser.uid}`);
              const data = response as any;
              setUserProfile({
                id: firebaseUser.uid,
                name: data.name || firebaseUser.displayName || "",
                email: data.email || firebaseUser.email || "",
                phone: data.phone,
                rating: data.rating || 5.0,
                verified: data.verified || false,
                emailVerified: data.emailVerified || false,
                createdAt: new Date(data.createdAt),
                savedLocationName: data.savedLocationName,
                savedLocationAddress: data.savedLocationAddress,
                savedLocationLat: data.savedLocationLat,
                savedLocationLng: data.savedLocationLng,
                walletBalance: data.walletBalance || 0,
                subscriptionStatus: data.subscriptionStatus || "free",
              });
            } catch (createError) {
              console.error("Error creating user:", createError);
              setUserProfile(null);
            }
          } else {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
          }
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

    // Sync user to PostgreSQL
    const newUser = {
      id: firebaseUser.uid,
      name,
      email,
      rating: 5.0,
      verified: false,
      emailVerified: isEmailVerified,
      walletBalance: 0,
      subscriptionStatus: "free" as const,
    };
    await apiRequest("POST", "/api/users", newUser);

    setUserProfile({
      ...newUser,
      createdAt: new Date(),
    });
  };

  const completeSignUp = async () => {
    if (!pendingVerification) return;
    
    const { email, password, name } = pendingVerification;
    await signUp(email, password, name, true);
    setPendingVerification(null);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    setPendingVerification(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    // Update in PostgreSQL
    await apiRequest("PATCH", `/api/users/${user.uid}`, data);

    if (data.name) {
      await updateProfile(user, { displayName: data.name });
    }

    setUserProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  const sendVerificationCode = async (email: string) => {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    // Store in memory (in-app only for demo purposes)
    // For production, use /api/verification-codes endpoint
    const storageKey = `code_${email.toLowerCase()}`;
    const codeData = { code, expiresAt: expiresAt.toISOString() };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(codeData));
    }
    
    console.log(`Verification code for ${email}: ${code}`);
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    const storageKey = `code_${email.toLowerCase()}`;
    let codeData = null;
    
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          codeData = JSON.parse(stored);
        } catch (e) {
          return false;
        }
      }
    }
    
    if (!codeData) {
      return false;
    }
    
    const expiresAt = new Date(codeData.expiresAt);
    
    if (new Date() > expiresAt) {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      return false;
    }
    
    if (codeData.code !== code) {
      return false;
    }
    
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(storageKey);
    }
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
        completeSignUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
