"use client";

import { RuleBuilder } from "@/components/admin/RuleBuilder";

export default function AdminRulesPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <RuleBuilder />
    </div>
  );
}
