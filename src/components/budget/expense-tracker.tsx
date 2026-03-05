"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, Trash2, TrendingUp, Wallet,
  ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

const CATEGORIES = ["FOOD", "TRANSPORT", "ACTIVITIES", "ACCOMMODATION", "SHOPPING", "MISCELLANEOUS"];
const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-500", TRANSPORT: "bg-blue-500", ACTIVITIES: "bg-violet-500",
  ACCOMMODATION: "bg-emerald-500", SHOPPING: "bg-pink-500", MISCELLANEOUS: "bg-gray-500",
};
const CATEGORY_LABELS: Record<string, string> = {
  FOOD: "Food & Dining", TRANSPORT: "Transport", ACTIVITIES: "Activities",
  ACCOMMODATION: "Accommodation", SHOPPING: "Shopping", MISCELLANEOUS: "Other",
};

interface Expense {
  id: string;
  category: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
}

interface Props {
  tripId: string;
  budget?: { total: number; currency: string; food: number; transport: number; activities: number; accommodation: number; shopping: number; miscellaneous: number } | null;
}

export default function ExpenseTracker({ tripId, budget }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "FOOD", title: "", amount: "", currency: budget?.currency ?? "USD", date: format(new Date(), "yyyy-MM-dd") });

  const load = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/expenses`);
    const data = await res.json();
    setExpenses(data.data?.expenses ?? []);
    setTotals(data.data?.totals ?? {});
    setGrandTotal(data.data?.grandTotal ?? 0);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const addExpense = async () => {
    if (!form.title || !form.amount) return;
    const res = await fetch(`/api/trips/${tripId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const data = await res.json();
    if (res.ok) {
      setExpenses((prev) => [data.data.expense, ...prev]);
      setTotals((prev) => ({ ...prev, [form.category]: (prev[form.category] ?? 0) + parseFloat(form.amount) }));
      setGrandTotal((prev) => prev + parseFloat(form.amount));
      setForm({ ...form, title: "", amount: "" });
      setShowForm(false);
      toast.success("Expense added");
    } else {
      toast.error(data.error);
    }
  };

  const removeExpense = async (id: string, amount: number, category: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setTotals((prev) => ({ ...prev, [category]: (prev[category] ?? 0) - amount }));
    setGrandTotal((prev) => prev - amount);
    await fetch(`/api/trips/${tripId}/expenses?expenseId=${id}`, { method: "DELETE" });
    toast.success("Expense removed");
  };

  const budgetTotal = budget?.total ?? 0;
  const overBudget = budgetTotal > 0 && grandTotal > budgetTotal;
  const remaining = budgetTotal > 0 ? budgetTotal - grandTotal : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Spent</p>
          <p className="text-lg font-bold">{budget?.currency ?? "USD"} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        {budgetTotal > 0 && (
          <>
            <div className="rounded-xl border bg-card p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-lg font-bold">{budget?.currency ?? "USD"} {budgetTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className={cn("rounded-xl border p-3 space-y-1 col-span-2 sm:col-span-1", overBudget ? "bg-destructive/10 border-destructive/30" : "bg-emerald-500/10 border-emerald-500/30")}>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {overBudget ? <ArrowUpRight className="h-3 w-3 text-destructive" /> : <ArrowDownRight className="h-3 w-3 text-emerald-500" />}
                {overBudget ? "Over budget" : "Remaining"}
              </p>
              <p className={cn("text-lg font-bold", overBudget ? "text-destructive" : "text-emerald-500")}>
                {budget?.currency ?? "USD"} {Math.abs(remaining ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Category breakdown */}
      {CATEGORIES.map((cat) => {
        const spent = totals[cat] ?? 0;
        const planned = budget ? ((budget as unknown) as Record<string, number>)[cat.toLowerCase()] ?? 0 : 0;
        const pct = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
        if (spent === 0 && planned === 0) return null;
        return (
          <div key={cat} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", CATEGORY_COLORS[cat])} />
                {CATEGORY_LABELS[cat]}
              </span>
              <span className="text-muted-foreground text-xs">
                {spent.toFixed(0)} {planned > 0 && `/ ${planned.toFixed(0)}`}
              </span>
            </div>
            {planned > 0 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", spent > planned ? "bg-destructive" : CATEGORY_COLORS[cat])}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Add expense */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Expenses
          </h4>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowForm(!showForm)}>
            <PlusCircle className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border p-3 space-y-2 bg-muted/30"
          >
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-lg border bg-background px-2 py-1.5 text-sm col-span-2"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <Input placeholder="Description" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-8 text-sm col-span-2" />
              <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-8 text-sm" />
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={addExpense}>Save</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Expense list */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {expenses.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No expenses yet</p>
            </div>
          )}
          {expenses.map((expense) => (
            <motion.div
              key={expense.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 group hover:bg-muted/40"
            >
              <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", CATEGORY_COLORS[expense.category] ?? "bg-gray-400")} />
              <span className="flex-1 text-sm truncate">{expense.title}</span>
              <span className="text-sm font-medium tabular-nums">
                {expense.currency} {expense.amount.toFixed(2)}
              </span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 hidden sm:flex">
                {format(new Date(expense.date), "MMM d")}
              </Badge>
              <button
                onClick={() => removeExpense(expense.id, expense.amount, expense.category)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
