"use client";

import { ExpenseForm } from "@/components/employee/ExpenseForm";
import { ExpenseHistory } from "@/components/employee/ExpenseHistory";

export default function EmployeeDashboardPage() {
  const handleExpenseSubmit = () => {
    // In actual implementation, refreshing the mock or fetching API
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6 items-start h-full">
      <div className="w-full xl:max-w-md h-full pb-4">
        <ExpenseForm onSubmit={handleExpenseSubmit} />
      </div>
      <div className="w-full h-full pb-4">
        <ExpenseHistory />
      </div>
    </div>
  );
}
