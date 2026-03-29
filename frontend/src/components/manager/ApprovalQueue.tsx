"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Expense, expensesApi } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useSocket } from "@/providers/SocketProvider";
import { BadgeCheck, XCircle, CheckCircle2, Loader2 } from "lucide-react";

export function ApprovalQueue() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseCurrency = user?.currency || "USD";

  const fetchQueue = useCallback(async () => {
    try {
      const data = await expensesApi.list();
      // The backend filters based on role/reportees, but we ensure we only show WAITING_APPROVAL
      setExpenses(data.expenses.filter(e => e.status === "WAITING_APPROVAL"));
    } catch (error) {
      console.error("Failed to fetch approval queue:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => fetchQueue();
    socket.on("expense_submitted", handleRefresh);
    socket.on("expense_approved", handleRefresh);
    socket.on("expense_rejected", handleRefresh);
    return () => {
      socket.off("expense_submitted", handleRefresh);
      socket.off("expense_approved", handleRefresh);
      socket.off("expense_rejected", handleRefresh);
    };
  }, [socket, fetchQueue]);

  const openModal = (expense: Expense, type: "APPROVE" | "REJECT") => {
    setSelectedExpense(expense);
    setActionType(type);
    setComment("");
  };

  const handleAction = async () => {
    if (!comment.trim() || !selectedExpense) {
      toast.error("Please provide a comment.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (actionType === "APPROVE") {
        await expensesApi.approve(selectedExpense.id, comment);
      } else {
        await expensesApi.reject(selectedExpense.id, comment);
      }
      
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      
      toast.success(`Expense ${actionType === "APPROVE" ? "approved" : "rejected"} successfully`, {
        description: selectedExpense.description,
      });
      
      setSelectedExpense(null);
      setActionType(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process approval action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="bg-card/40 backdrop-blur-xl border-white/5 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BadgeCheck className="w-5 h-5 text-amber-500" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Review and action expenses awaiting your approval.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md">
              <TableRow className="border-border">
                <TableHead className="font-semibold px-4 py-3">Employee</TableHead>
                <TableHead className="font-semibold">Subject / Details</TableHead>
                <TableHead className="font-semibold">Request Date</TableHead>
                <TableHead className="font-semibold text-right">Total ({baseCurrency})</TableHead>
                <TableHead className="font-semibold text-center w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <Loader2 className="w-10 h-10 mx-auto animate-spin opacity-20 mb-3" />
                    Loading queue...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-500/20 mb-3" />
                    You're all caught up! No pending approvals.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow 
                    key={expense.id} 
                    className="hover:bg-muted/50 border-border transition-all group"
                  >
                    <TableCell className="font-medium px-4 py-3">
                      {expense.employee.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{expense.description}</span>
                        <span className="text-xs text-muted-foreground">{expense.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-amber-500/90">
                      {baseCurrency === "USD" ? "$" : `${baseCurrency} `}{expense.convertedAmount.toFixed(2)}
                      {expense.currency !== baseCurrency && (
                        <div className="text-[10px] text-muted-foreground font-normal">
                          Orig: {expense.currency} {expense.amount.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2 options-row">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                          onClick={() => openModal(expense, "APPROVE")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20"
                          onClick={() => openModal(expense, "REJECT")}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVE" ? "Approve Expense" : "Reject Expense"}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense?.employee.name} - {selectedExpense?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <div className="flex justify-between items-center mb-4 p-3 bg-muted/30 rounded-lg border border-border">
              <span className="text-sm font-medium">Total Amount:</span>
               <span className="text-lg font-bold text-foreground">
                {baseCurrency === "USD" ? "$" : `${baseCurrency} `}{selectedExpense?.convertedAmount.toFixed(2)}
              </span>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm">
                Mandatory Comment <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder={actionType === "APPROVE" ? "e.g. Approved per policy." : "e.g. Over expected limit, please clarify."}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
             <Button variant="ghost" onClick={() => setSelectedExpense(null)} disabled={isSubmitting}>
               Cancel
             </Button>
             <Button 
               onClick={handleAction} 
               disabled={isSubmitting || !comment.trim()}
               className={actionType === "APPROVE" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-destructive hover:bg-destructive/90 text-white"}
             >
               {isSubmitting ? "Processing..." : `Confirm ${actionType === "APPROVE" ? "Approval" : "Rejection"}`}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
