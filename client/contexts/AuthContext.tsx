import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  onAuthStateChanged,
  reload as reloadUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  registerForPushNotifications, 
  syncFCMTokenWithBackend,
  removeFCMTokenFromBackend 
} from '../lib/notifications';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rating: number;
  verified: boolean;
  emailVerified: boolean;
  createdAt: Date;
  role?: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  googleLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sync Firebase user with backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser, additionalData?: { name?: string; phone?: string }) => {
    try {
      const token = await firebaseUser.getIdToken();
      await AsyncStorage.setItem('firebaseToken', token);

      const response = await fetch(`${API_URL}/firebase/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(additionalData || {}),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user with backend');
      }

      const { user: userData } = await response.json();
      
      const profile: UserProfile = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        rating: userData.rating,
        verified: userData.verified,
        emailVerified: firebaseUser.emailVerified,
        createdAt: new Date(userData.createdAt),
        role: userData.role,
        subscriptionTier: userData.subscriptionTier,
        subscriptionStatus: userData.subscriptionStatus,
      };

      setUser(profile);
      setUserProfile(profile);

      // Register for push notifications
      const fcmToken = await registerForPushNotifications();
      if (fcmToken) {
        await syncFCMTokenWithBackend(fcmToken);
      }

      return profile;
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await syncUserWithBackend(firebaseUser);
        } else {
          setUser(null);
          setUserProfile(null);
          await AsyncStorage.removeItem('firebaseToken');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserWithBackend(userCredential.user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await firebaseSendEmailVerification(userCredential.user);
      
      // Sync with backend
      await syncUserWithBackend(userCredential.user, { name, phone });
    } catch (error: any) {
      console.error('Sign up error:', error);
      // Pass the specific error code or a more descriptive message
      const firebaseError = error as { code?: string; message: string };
      throw firebaseError;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      // In a real Expo environment, you would use expo-auth-session or a similar library 
      // to get the idToken. For now, we are providing a placeholder message.
      // This function needs to be correctly implemented with a native Google Sign-In flow.
      console.log('Google sign in attempted');
      throw new Error('Google Sign-In is not fully configured. Please use Email/Password for now.');
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Remove FCM token from backend
      await removeFCMTokenFromBackend();
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local storage
      await AsyncStorage.removeItem('firebaseToken');
      
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const token = await AsyncStorage.getItem('firebaseToken');
      
      const response = await fetch(`${API_URL}/firebase/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      
      setUser({ ...user, ...updatedUser });
      setUserProfile({ ...userProfile, ...updatedUser });
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  };

  const sendEmailVerification = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user signed in');
      }

      await firebaseSendEmailVerification(currentUser);
    } catch (error: any) {
      console.error('Send verification error:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await reloadUser(currentUser);
        await syncUserWithBackend(currentUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        googleLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateUserProfile,
        sendEmailVerification,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
