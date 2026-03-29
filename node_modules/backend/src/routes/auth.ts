import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const authRouter = Router();

// ─── Validation Schemas ───────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional().default("EMPLOYEE"),
  currency: z.string().default("USD"),
  country: z.string().default("US"),
  managerId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Helper ───────────────────────────────────────────────────────────────

function signToken(user: { id: string; email: string; role: string; name: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
  );
}

// ─── POST /api/auth/signup ────────────────────────────────────────────────

authRouter.post("/signup", async (req, res: Response): Promise<void> => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { name, email, password, role, currency, country, managerId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      currency,
      country,
      managerId: managerId || null,
    },
    select: { id: true, name: true, email: true, role: true, currency: true, country: true, managerId: true },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  res.status(201).json({ user, token });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────

authRouter.post("/login", async (req, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      currency: user.currency,
      country: user.country,
      managerId: user.managerId,
    },
    token,
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────

authRouter.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      currency: true,
      country: true,
      managerId: true,
      createdAt: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
});
