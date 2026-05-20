import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Server misconfiguration: JWT_SECRET missing" });
  }
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
