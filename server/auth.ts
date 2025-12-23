import crypto from "crypto";
import { storage } from "./storage";

const SALT_ROUNDS = 10;

export interface AuthPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString("hex") + ":" + derivedKey.toString("hex"));
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const saltBuf = Buffer.from(salt, "hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, saltBuf, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

export function generateToken(payload: AuthPayload): string {
  const tokenData = JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  });
  return Buffer.from(tokenData).toString("base64");
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthPayload | null> {
  const user = await storage.getUserByEmail(email);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return { userId: user.id, email: user.email };
}
