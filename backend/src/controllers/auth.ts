import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

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
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Generate JWT token
 */
function signToken(user: { id: string; email: string; role: string; name: string }) {
  const secret = process.env.JWT_SECRET || "fallback_secret_for_dev_only";
  const options: jwt.SignOptions = { expiresIn: "7d" };
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    secret,
    options
  );
}

/**
 * Register a new user/workspace
 */
export const signup = async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const { name, email, password, role, currency, country, managerId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
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
    select: { id: true, name: true, email: true, role: true, currency: true, country: true },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  res.status(201).json({ user, token });
};

/**
 * Authenticate user and return token
 */
export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid email or password" });
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
};

/**
 * Get current authenticated user session
 */
export const getMe = async (req: AuthRequest, res: Response) => {
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
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user });
};
