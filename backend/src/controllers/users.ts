import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middleware/auth";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).default("EMPLOYEE"),
  currency: z.string().default("USD"),
  country: z.string().default("US"),
  managerId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  currency: z.string().optional(),
  country: z.string().optional(),
  managerId: z.string().nullish(),
});

/**
 * Get all users with manager and count details (Admin only)
 */
export const getUsers = async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true,
      currency: true, country: true, managerId: true, createdAt: true,
      manager: { select: { id: true, name: true } },
      _count: { select: { expenses: true, reports: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({ users });
};

/**
 * Get detailed user profile by ID
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      currency: true, country: true, managerId: true, createdAt: true,
      manager: { select: { id: true, name: true } },
      reports: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (req: AuthRequest, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });

  const { name, email, password, role, currency, country, managerId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, currency, country, managerId: managerId || null },
    select: { id: true, name: true, email: true, role: true, currency: true, country: true, managerId: true, createdAt: true },
  });
  res.status(201).json({ user });
};

/**
 * Update user details
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });

  const { managerId, ...rest } = parsed.data;
  const user = await prisma.user.update({
    where: { id },
    data: { ...rest, ...(managerId !== undefined ? { managerId } : {}) },
    select: { id: true, name: true, email: true, role: true, currency: true, country: true, managerId: true, updatedAt: true },
  });
  res.json({ user });
};

/**
 * Delete a user
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await prisma.user.delete({ where: { id } });
  res.json({ message: "User deleted successfully" });
};
