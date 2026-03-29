"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  setAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      authApi.me()
        .then(({ user }) => setUser(user))
        .catch((err) => {
          // Only destroy session if explicitly rejected (e.g. token expired)
          if (err?.status === 401 || err?.status === 403) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setUser(null);
            setToken(null);
          } else {
            // Keep the user logged in if the error was a transient network crash and backend is unreachable
            const storedUser = localStorage.getItem("auth_user");
            if (storedUser) {
              try { setUser(JSON.parse(storedUser)); } catch {}
            }
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const setAuth = useCallback((user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password);
    setAuth(user, token);

    // Role-based redirect
    switch (user.role) {
      case "ADMIN":
        router.push("/admin/users");
        break;
      case "MANAGER":
        router.push("/manager/approvals");
        break;
      default:
        router.push("/employee/dashboard");
    }
  }, [setAuth, router]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/auth/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
