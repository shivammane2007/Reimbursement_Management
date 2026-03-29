import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";
import { io } from "../index";

export const expensesRouter = Router();
expensesRouter.use(authenticate);

const createExpenseSchema = z.object({
  description: z.string().min(3),
  amount: z.number().positive(),
  currency: z.string().length(3),
  convertedAmount: z.number().positive(),
  category: z.string().min(1),
  date: z.string(),
  receiptUrl: z.string().optional(),
  ocrRawText: z.string().optional(),
  ruleId: z.string().optional(),
});

const actionSchema = z.object({
  comment: z.string().min(3),
});

// ─── GET /api/expenses ────────────────────────────────────────────────────

expensesRouter.get("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const { role, id: userId } = req.user!;
  const where: Record<string, unknown> = {};

  if (role === "EMPLOYEE") {
    where.employeeId = userId;
  } else if (role === "MANAGER") {
    const reports = await prisma.user.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    where.employeeId = { in: reports.map((r: { id: string }) => r.id) };
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true, role: true } },
      approvalLogs: {
        include: { approver: { select: { id: true, name: true } } },
        orderBy: { step: "asc" },
      },
      rule: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ expenses });
});

// ─── GET /api/expenses/:id ─────────────────────────────────────────────────

expensesRouter.get("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params["id"] as string;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      approvalLogs: {
        include: { approver: { select: { id: true, name: true } } },
        orderBy: { step: "asc" },
      },
      rule: true,
    },
  });

  if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
  if (req.user!.role === "EMPLOYEE" && expense.employeeId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  res.json({ expense });
});

// ─── POST /api/expenses ────────────────────────────────────────────────────

expensesRouter.post("/", async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() }); return;
  }

  const data = parsed.data;
  let ruleId = data.ruleId;
  
  if (!ruleId) {
    try {
      const defaultRule = await prisma.approvalRule.findFirst({ 
        where: { isActive: true }, 
        orderBy: { createdAt: "asc" } 
      });
      ruleId = defaultRule?.id || null;
    } catch (error) {
      console.error("Failed to fetch default rule:", error);
      ruleId = null;
    }
  }

  const expense = await prisma.expense.create({
    data: {
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      convertedAmount: data.convertedAmount,
      category: data.category,
      date: new Date(data.date),
      receiptUrl: data.receiptUrl || null,
      ocrRawText: data.ocrRawText || null,
      status: "WAITING_APPROVAL",
      employeeId: req.user!.id,
      ruleId: ruleId,
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
  });

  io.to("MANAGER").emit("expense_submitted", {
    id: expense.id,
    description: expense.description,
    amount: expense.convertedAmount,
    employee: expense.employee.name,
  });
  io.to("ADMIN").emit("expense_submitted", {
    id: expense.id,
    description: expense.description,
    amount: expense.convertedAmount,
    employee: expense.employee.name,
  });

  res.status(201).json({ expense });
});

// ─── PATCH /api/expenses/:id/approve ─────────────────────────────────────

expensesRouter.patch("/:id/approve", requireRole("MANAGER", "ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const { comment } = parsed.data;
  const expenseId = req.params["id"] as string;

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      rule: { include: { steps: { orderBy: { order: "asc" } } } },
      approvalLogs: true,
      employee: { select: { id: true, name: true } },
    },
  });

  if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
  if (expense.status !== "WAITING_APPROVAL") { res.status(400).json({ error: `Already ${expense.status}` }); return; }

  const currentStep = expense.approvalLogs.length + 1;
  const totalSteps = expense.rule?.steps.length ?? 1;

  await prisma.approvalLog.create({
    data: { expenseId: expense.id, approverId: req.user!.id, action: "APPROVED", comment, step: currentStep },
  });

  const newStatus = (currentStep >= totalSteps || req.user!.role === "ADMIN") ? "APPROVED" : "WAITING_APPROVAL";

  const updated = await prisma.expense.update({
    where: { id: expense.id },
    data: { status: newStatus },
    include: { employee: { select: { id: true, name: true } } },
  });

  if (newStatus === "APPROVED") {
    io.to(updated.employee.id).emit("expense_approved", {
      id: updated.id,
      description: updated.description,
      approver: req.user!.name,
    });
  }

  res.json({ expense: updated });
});

// ─── PATCH /api/expenses/:id/reject ───────────────────────────────────────

expensesRouter.patch("/:id/reject", requireRole("MANAGER", "ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const { comment } = parsed.data;
  const expenseId = req.params["id"] as string;

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { employee: { select: { id: true, name: true } } },
  });

  if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
  if (expense.status !== "WAITING_APPROVAL") { res.status(400).json({ error: `Already ${expense.status}` }); return; }

  const currentStep = (await prisma.approvalLog.count({ where: { expenseId } })) + 1;

  await prisma.approvalLog.create({
    data: { expenseId, approverId: req.user!.id, action: "REJECTED", comment, step: currentStep },
  });

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status: "REJECTED", rejectionReason: comment },
    include: { employee: { select: { id: true, name: true } } },
  });

  io.to(updated.employee.id).emit("expense_rejected", {
    id: updated.id,
    description: updated.description,
    rejectionReason: comment,
    rejectedBy: req.user!.name,
  });

  res.json({ expense: updated });
});

// ─── PATCH /api/expenses/:id/status (Admin override) ─────────────────────

expensesRouter.patch("/:id/status", requireRole("ADMIN"), async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({ status: z.enum(["APPROVED", "REJECTED"]), comment: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const { status, comment } = parsed.data;
  const expenseId = req.params["id"] as string;

  const currentStep = (await prisma.approvalLog.count({ where: { expenseId } })) + 1;

  await prisma.approvalLog.create({
    data: { expenseId, approverId: req.user!.id, action: status, comment: `[ADMIN OVERRIDE] ${comment}`, step: currentStep },
  });

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status, rejectionReason: status === "REJECTED" ? comment : null },
    include: { employee: { select: { id: true, name: true } } },
  });

  const eventName = status === "APPROVED" ? "expense_approved" : "expense_rejected";
  io.to(updated.employee.id).emit(eventName, { id: updated.id, description: updated.description, overriddenBy: req.user!.name });

  res.json({ expense: updated });
});
