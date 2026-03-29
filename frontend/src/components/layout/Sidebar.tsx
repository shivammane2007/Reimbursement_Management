"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  CircleDollarSign, 
  LayoutDashboard, 
  Settings, 
  Users,
  BadgeCheck,
  Receipt
} from "lucide-react";

const navItems = {
  EMPLOYEE: [
    { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  ],
  MANAGER: [
    { label: "Approvals Queue", href: "/manager/approvals", icon: BadgeCheck },
  ],
  ADMIN: [
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Approval Rules", href: "/admin/rules", icon: Settings },
    { label: "Global Expenses", href: "/admin/expenses", icon: Receipt },
  ],
};

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const links = navItems[role as keyof typeof navItems] || [];

  return (
    <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Building2 className="w-6 h-6 text-primary mr-3" />
        <span className="font-bold text-lg tracking-tight">Acme Corp</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4 px-2">
          {role} ACTIONS
        </div>
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg border border-border">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {role[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{role.toLowerCase()} user</span>
            <span className="text-xs text-muted-foreground">Demo Session</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
