import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

export const usersRouter = Router();
usersRouter.use(authenticate, requireRole("ADMIN"));

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

// ─── GET /api/users ────────────────────────────────────────────────────────

usersRouter.get("/", async (_req: AuthRequest, res: Response): Promise<void> => {
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
});

// ─── GET /api/users/:id ────────────────────────────────────────────────────

usersRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      currency: true, country: true, managerId: true, createdAt: true,
      manager: { select: { id: true, name: true } },
      reports: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ user });
});

// ─── POST /api/users ───────────────────────────────────────────────────────

usersRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() }); return; }

  const { name, email, password, role, currency, country, managerId } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { res.status(409).json({ error: "Email already in use" }); return; }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, currency, country, managerId: managerId || null },
    select: { id: true, name: true, email: true, role: true, currency: true, country: true, managerId: true, createdAt: true },
  });
  res.status(201).json({ user });
});

// ─── PUT /api/users/:id ────────────────────────────────────────────────────

usersRouter.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() }); return; }

  const { managerId, ...rest } = parsed.data;
  const user = await prisma.user.update({
    where: { id },
    data: { ...rest, ...(managerId !== undefined ? { managerId } : {}) },
    select: { id: true, name: true, email: true, role: true, currency: true, country: true, managerId: true, updatedAt: true },
  });
  res.json({ user });
});

// ─── DELETE /api/users/:id ─────────────────────────────────────────────────

usersRouter.delete("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  await prisma.user.delete({ where: { id } });
  res.json({ message: "User deleted successfully" });
});
