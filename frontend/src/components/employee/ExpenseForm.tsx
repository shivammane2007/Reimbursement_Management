"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Scan, Upload, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Tesseract from "tesseract.js";
import { useAuth } from "@/providers/AuthProvider";
import { expensesApi } from "@/lib/api";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"];
const CATEGORIES = ["Meals", "Travel", "Software", "Hardware", "Office", "Other"];

export function ExpenseForm({ onSubmit }: { onSubmit: () => void }) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [convertedAmt, setConvertedAmt] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (user?.currency) {
      setCurrency(user.currency);
    }
  }, [user]);

  if (!isMounted) return null;

  const baseCurrency = user?.currency || "USD";

  // Debounced effect to fetch converted rate
  // In a real app this would use a debounce hook
  const handleAmountChange = async (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      if (currency === baseCurrency) {
        setConvertedAmt(num);
        return;
      }
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
        const data = await res.json();
        const rate = data.rates[baseCurrency];
        if (rate) {
          setConvertedAmt(num * rate);
        }
      } catch (err) {
        // Fallback for demo
        setConvertedAmt(num * 1.05);
      }
    } else {
      setConvertedAmt(null);
    }
  };

  const handleCurrencyChange = (curr: string | null) => {
    if (!curr) return;
    setCurrency(curr);
    handleAmountChange(amount);
  };

  const processOCR = async (file: File) => {
    setIsScanning(true);
    toast("Scanning receipt with AI...");
    try {
      // Using generic eng lang.
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });
      const text = result.data.text;
      
      // Heuristic extraction
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      // Very naive merchant extraction (assume first line is merchant)
      if (lines.length > 0 && !description) {
        setDescription(lines[0]);
      }

      // Amount regex
      const amountMatch = text.match(/[\$\€\£\₹]?\s*(\d+[\.,]\d{2})/i);
      if (amountMatch && amountMatch[1]) {
        const extractedAmt = amountMatch[1].replace(',', '.');
        setAmount(extractedAmt);
        handleAmountChange(extractedAmt);
        toast.success("AI found amount: " + extractedAmt);
      } else {
        toast.info("Could not autodetect amount. Please verify.");
      }

      // Date regex (simple mm/dd/yyyy or similar)
      const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      if (dateMatch && !date) {
        const [, m, d, y] = dateMatch;
        const year = y.length === 2 ? `20${y}` : y;
        const formattedDate = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        // Validate date isn't crazy
        if (!isNaN(new Date(formattedDate).getTime())) {
          setDate(formattedDate);
          toast.success("AI found date: " + formattedDate);
        }
      }
    } catch (error) {
      toast.error("Failed to read receipt OCR.");
    } finally {
      setIsScanning(false);
    }
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processOCR(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date || !description || convertedAmt === null) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await expensesApi.create({
        description,
        amount: parseFloat(amount),
        currency,
        convertedAmount: convertedAmt,
        category,
        date,
      });

      toast.success("Expense submitted and is Waiting Approval!");
      setAmount("");
      setConvertedAmt(null);
      setCategory("");
      setDate("");
      setDescription("");
      onSubmit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-white/5">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          Submit Expense
        </CardTitle>
        <CardDescription>
          Upload a receipt to auto-fill details, or manually enter them.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={onFileUpload}
          />
          <Button 
            variant="outline" 
            className="w-full h-16 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary transition-all group"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
          >
            {isScanning ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Scan className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-semibold">{isScanning ? "AI scanning receipt..." : "Smart Scan Receipt with AI"}</span>
            {!isScanning && <Sparkles className="w-4 h-4 ml-2 opacity-70" />}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => handleAmountChange(e.target.value)}
                required
                className="bg-background/50 h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={handleCurrencyChange} required>
                <SelectTrigger className="bg-background/50 h-10">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {convertedAmt !== null && currency !== baseCurrency && (
            <div className="text-xs font-medium px-3 py-2 bg-muted/50 rounded-md border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Company Base ({baseCurrency}) Equivalent:</span>
              <span className="text-foreground font-semibold">≈ ${convertedAmt.toFixed(2)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v || "")} required>
                <SelectTrigger className="bg-background/50 h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-background/50 h-10 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description / Merchant</Label>
            <Input 
              placeholder="e.g. Uber to Airport" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-background/50 h-10"
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? "Submitting..." : "Submit Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
