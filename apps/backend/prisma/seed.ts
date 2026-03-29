import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Clean existing data ───────────────────────────
  await prisma.approvalLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalRule.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Users ──────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const employeePassword = await bcrypt.hash("employee123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Setup",
      email: "admin@acme.com",
      password: adminPassword,
      role: "ADMIN",
      currency: "USD",
      country: "US",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Sarah Manager",
      email: "manager@acme.com",
      password: managerPassword,
      role: "MANAGER",
      currency: "USD",
      country: "US",
      managerId: admin.id,
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: "John Employee",
      email: "employee@acme.com",
      password: employeePassword,
      role: "EMPLOYEE",
      currency: "USD",
      country: "US",
      managerId: manager.id,
    },
  });

  // ─── Create Approval Rule ──────────────────────────
  const rule = await prisma.approvalRule.create({
    data: {
      name: "Standard Approval Flow",
      description: "Manager then Finance approval required for all expenses.",
      isActive: true,
      includeDirectManager: true,
      minApprovalPercentage: 100,
      overrideApproverId: admin.id,
      steps: {
        create: [
          { order: 1, userId: manager.id },
          { order: 2, userId: admin.id },
        ],
      },
    },
  });

  // ─── Create Sample Expenses ────────────────────────
  const approvedExpense = await prisma.expense.create({
    data: {
      description: "Client dinner at STK",
      amount: 345.50,
      currency: "USD",
      convertedAmount: 345.50,
      category: "Meals",
      date: new Date("2026-03-24"),
      status: "APPROVED",
      employeeId: employee.id,
      ruleId: rule.id,
    },
  });

  await prisma.approvalLog.create({
    data: {
      expenseId: approvedExpense.id,
      approverId: manager.id,
      action: "APPROVED",
      comment: "Looks good to me.",
      step: 1,
    },
  });

  await prisma.approvalLog.create({
    data: {
      expenseId: approvedExpense.id,
      approverId: admin.id,
      action: "APPROVED",
      comment: "Finance approved.",
      step: 2,
    },
  });

  const pendingExpense = await prisma.expense.create({
    data: {
      description: "AWS Cloud Hosting - March",
      amount: 1450.00,
      currency: "EUR",
      convertedAmount: 1560.25,
      category: "Software",
      date: new Date("2026-03-25"),
      status: "WAITING_APPROVAL",
      employeeId: employee.id,
      ruleId: rule.id,
    },
  });

  const rejectedExpense = await prisma.expense.create({
    data: {
      description: "Uber to Airport",
      amount: 85.00,
      currency: "GBP",
      convertedAmount: 105.40,
      category: "Travel",
      date: new Date("2026-03-26"),
      status: "REJECTED",
      rejectionReason: "Out of policy for local travel.",
      employeeId: employee.id,
      ruleId: rule.id,
    },
  });

  await prisma.approvalLog.create({
    data: {
      expenseId: rejectedExpense.id,
      approverId: manager.id,
      action: "REJECTED",
      comment: "Out of policy for local travel.",
      step: 1,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Admin:    admin@acme.com    / admin123");
  console.log("   Manager:  manager@acme.com  / manager123");
  console.log("   Employee: employee@acme.com / employee123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
