import type { Request, Response, NextFunction } from "express";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}


export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const user = await verifyFirebaseToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    
    req.user = user;
    
    // Check if user is admin in database
    const { storage } = await import("./storage");
    const dbUser = await storage.getUser(user.uid);
    
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (dbUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    
    if (dbUser.suspended) {
      return res.status(403).json({ error: "Forbidden: Account suspended" });
    }
    
    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
}
