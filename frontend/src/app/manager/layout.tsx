"use client";

import { AppLayout } from "@/components/layout/AppLayout";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="MANAGER">{children}</AppLayout>;
}
