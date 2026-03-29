"use client";

import { ApprovalQueue } from "@/components/manager/ApprovalQueue";

export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="w-full h-full pb-4">
        <ApprovalQueue />
      </div>
    </div>
  );
}
