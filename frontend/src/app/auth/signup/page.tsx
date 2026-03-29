"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Country = {
  name: { common: string };
  currencies: Record<string, { name: string; symbol: string }>;
};

export default function SignupPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,currencies");
        const data: Country[] = await res.json();
        const sorted = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      } catch (error) {
        toast.error("Failed to load countries");
      }
    }
    fetchCountries();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry) {
      toast.error("Please select a country.");
      return;
    }
    setIsLoading(true);

    try {
      const countryObj = countries.find(c => c.name.common === selectedCountry);
      const baseCurrency = countryObj ? Object.keys(countryObj.currencies)[0] : "USD";

      await authApi.signup({
        name: companyName, // For demo, company name is user name
        email,
        password,
        role: "ADMIN",
        currency: baseCurrency,
        country: selectedCountry,
      });

      toast.success("Workspace created!", {
        description: `Your admin account for ${companyName} is ready.`,
      });
      
      router.push("/auth/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-background">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-70" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] opacity-70" />

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 z-10 w-full lg:w-[600px] border-r border-border bg-card/10 backdrop-blur-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-96"
        >
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Acme Corp</h1>
              </div>
            </div>
            
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">Create workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Set up your company space to manage expenses.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSignup} className="space-y-5">
              
              <div className="space-y-1.5">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  required
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-background/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Headquarters Country</Label>
                <Select value={selectedCountry} onValueChange={(v) => setSelectedCountry(v || "")} required>
                  <SelectTrigger className="bg-background/50 h-10 text-muted-foreground w-full">
                    <SelectValue placeholder="Select a country..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map((c) => (
                      <SelectItem key={c.name.common} value={c.name.common}>
                        {c.name.common}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">This sets your base company currency automatically.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Admin Email (You)</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 h-10"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-primary-foreground font-medium mt-2"
              >
                {isLoading ? "Creating..." : "Create Workspace"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <span className="bg-background px-2">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </span>
            </div>
            
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 bg-muted/10">
      </div>
    </div>
  );
}
