"use client";

import { AdminUsersList } from "@/components/admin/AdminUsersList";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <AdminUsersList />
    </div>
  );
}
