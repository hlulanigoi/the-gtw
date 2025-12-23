import type { Request, Response, NextFunction } from "express";
import { verifyToken, type AuthPayload } from "./auth";

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  req.user = payload;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split("Bearer ")[1];
  const payload = verifyToken(token);

  if (payload) {
    req.user = payload;
  }

  next();
}
