"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { motion } from "framer-motion";

export function AppLayout({ children, role }: { children: ReactNode; role: string }) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative selection:bg-primary/30">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-10">
        <Topbar role={role} />
        
        <main className="flex-1 overflow-x-hidden p-4 md:p-8 relative bg-black/20 backdrop-blur-3xl">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full h-full max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
