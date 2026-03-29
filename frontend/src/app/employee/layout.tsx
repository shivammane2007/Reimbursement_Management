"use client";

import { AppLayout } from "@/components/layout/AppLayout";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="EMPLOYEE">{children}</AppLayout>;
}
