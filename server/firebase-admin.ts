import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (!serviceAccount.project_id) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON is missing or invalid. Falling back to default auth.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;

export async function verifyFirebaseToken(idToken: string) {
  if (!adminAuth) {
    // Fallback if admin is not initialized
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.EXPO_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        }
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (data.users && data.users.length > 0) {
        return {
          uid: data.users[0].localId,
          email: data.users[0].email,
        };
      }
    } catch (e) {
      console.error('Fallback token verification failed:', e);
    }
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error('Error verifying Firebase token with Admin SDK:', error);
    return null;
  }
}

import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  verifyFirebaseToken(token)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }
      req.user = user;
      next();
    })
    .catch((error) => {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Authentication error" });
    });
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split("Bearer ")[1];

  verifyFirebaseToken(token)
    .then((user) => {
      if (user) {
        req.user = user;
      }
      next();
    })
    .catch(() => {
      next();
    });
}
