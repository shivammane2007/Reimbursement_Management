"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen relative overflow-hidden bg-background">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-70" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] opacity-70" />
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 w-full lg:w-[600px] border-r border-border bg-card/10 backdrop-blur-3xl">
          <div className="mx-auto w-full max-w-sm lg:w-96 opacity-0" />
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Login successful!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Login failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-70" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] opacity-70" />

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 w-full lg:w-[600px] border-r border-border bg-card/10 backdrop-blur-3xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-96"
        >
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Acme Corp</h1>
                <p className="text-sm text-muted-foreground font-medium">Smart Reimbursements</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Sign in</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your work email and password.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-white/10 focus-visible:ring-primary h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="font-medium text-sm text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-white/10 focus-visible:ring-primary h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-primary-foreground font-medium"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                ) : "Sign in"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <span className="bg-background px-2">
                Don't have a company account?{" "}
                <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Create workspace
                </Link>
              </span>
            </div>
            
            <div className="mt-6 border border-border bg-card/30 p-4 rounded-lg flex flex-col gap-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Demo credentials (after seeding DB):</div>
              <div className="text-xs flex gap-2"><BadgeCheck className="w-4 h-4 text-red-500" /> admin@acme.com / admin123</div>
              <div className="text-xs flex gap-2"><BadgeCheck className="w-4 h-4 text-amber-500" /> manager@acme.com / manager123</div>
              <div className="text-xs flex gap-2"><BadgeCheck className="w-4 h-4 text-gray-400" /> employee@acme.com / employee123</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-xl text-center z-10 space-y-8"
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter">
            Automate your expense approvals.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            AI-powered receipt scanning, real-time currency conversion, and custom approval workflows. All in one dark, minimalist dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
