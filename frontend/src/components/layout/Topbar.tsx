"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Topbar({ role }: { role: string }) {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app we would clear auth tokens here
    router.push("/auth/login");
  };

  return (
    <header className="h-16 w-full px-6 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>

        <h2 className="text-xl font-medium hidden md:block tracking-tight">
          {role === "EMPLOYEE" && "Employee Dashboard"}
          {role === "MANAGER" && "Manager Workspace"}
          {role === "ADMIN" && "Admin Console"}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-card hidden" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogout}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
