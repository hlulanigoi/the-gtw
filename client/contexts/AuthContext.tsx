import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rating: number;
  verified: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  pendingVerification: { email: string; name: string; password: string } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
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
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    name: string;
    password: string;
  } | null>(null);

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

    setUserProfile({
      id: firebaseUser.uid,
      name,
      email,
      rating: 5.0,
      verified: false,
      emailVerified: isEmailVerified,
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

    await setDoc(doc(db, "users", user.uid), data, { merge: true });

    if (data.name) {
      await updateProfile(user, { displayName: data.name });
    }

    setUserProfile((prev) => prev ? { ...prev, ...data } : null);
  };

  const sendVerificationCode = async (email: string) => {
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await setDoc(doc(db, "verificationCodes", email.toLowerCase()), {
      code,
      email: email.toLowerCase(),
      expiresAt,
      createdAt: serverTimestamp(),
    });
    
    console.log(`Verification code for ${email}: ${code}`);
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    const codeDoc = await getDoc(doc(db, "verificationCodes", email.toLowerCase()));
    
    if (!codeDoc.exists()) {
      return false;
    }
    
    const data = codeDoc.data();
    const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
    
    if (new Date() > expiresAt) {
      await deleteDoc(doc(db, "verificationCodes", email.toLowerCase()));
      return false;
    }
    
    if (data.code !== code) {
      return false;
    }
    
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
        pendingVerification,
        signIn,
        signUp,
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
