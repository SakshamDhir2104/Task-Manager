import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
    },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  const token = signToken(user.id, user.email);
  return res.status(201).json({ user, token });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signToken(user.id, user.email);
  return res.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token,
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user });
});

function signToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign({ sub: userId, email }, secret, { expiresIn: "7d" });
}

export default router;
