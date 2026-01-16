import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

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
  user: UserProfile | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    name: string;
    password: string;
  } | null>(null);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setUserProfile(userData);
          } else {
            await AsyncStorage.removeItem("authToken");
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const { token, user: userData } = await response.json();
    await AsyncStorage.setItem("authToken", token);
    setUser(userData);
    setUserProfile(userData);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Sign up failed");
    }

    const { token, user: userData } = await response.json();
    await AsyncStorage.setItem("authToken", token);
    setUser(userData);
    setUserProfile(userData);
  };

  const signInWithGoogle = async () => {
    // Google sign-in would require Google OAuth flow
    // For now, we'll show a placeholder
    throw new Error("Google sign-in is not yet implemented with the API");
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("authToken");
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;

    const token = await AsyncStorage.getItem("authToken");
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Profile update failed");
    }

    const updatedUser = await response.json();
    setUser(updatedUser);
    setUserProfile(updatedUser);
  };

  const sendVerificationCode = async (email: string) => {
    const response = await fetch(`${API_URL}/auth/send-verification-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send verification code");
    }
  };

  const verifyCode = async (email: string, code: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.valid || false;
  };

  const resetPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Password reset failed");
    }
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
