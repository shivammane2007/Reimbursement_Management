"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        autoConnect: true,
        auth: token ? { token } : undefined,
        transports: ["websocket", "polling"],
      }
    );

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("🔌 Socket connected:", socketInstance.id);

      // Join role-based room so backend can broadcast targeted events
      const userStr = typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Join role room (e.g., "MANAGER", "ADMIN") for broadcast
          socketInstance.emit("join_room", user.role);
          // Join personal room for targeted notifications
          socketInstance.emit("join_room", user.id);
        } catch (_) {
          // ignore
        }
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ Socket disconnected");
    });

    socketInstance.on("connect_error", (err) => {
      // Silently fail — backend may not be running yet
      console.warn("Socket connection failed:", err.message);
    });

    // ─── Real-time Event Handlers ────────────────────────────────────────

    socketInstance.on("expense_submitted", (data: { employee: string; description: string; amount: number }) => {
      toast("📋 New Expense Submitted", {
        description: `${data.employee} submitted "${data.description}" for $${data.amount?.toFixed(2)}`,
      });
    });

    socketInstance.on("expense_approved", (data: { description: string; approver?: string; overriddenBy?: string }) => {
      toast.success("✅ Expense Approved!", {
        description: `"${data.description}" was approved${data.approver ? ` by ${data.approver}` : ""}.`,
      });
    });

    socketInstance.on("expense_rejected", (data: { description: string; rejectionReason?: string; rejectedBy?: string }) => {
      toast.error("❌ Expense Rejected", {
        description: `"${data.description}" was rejected: ${data.rejectionReason || "No reason given"}.`,
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
