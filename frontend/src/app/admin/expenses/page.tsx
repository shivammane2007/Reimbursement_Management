"use client";

import { AdminExpensesList } from "@/components/admin/AdminExpensesList";

export default function AdminExpensesPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <AdminExpensesList />
    </div>
  );
}
