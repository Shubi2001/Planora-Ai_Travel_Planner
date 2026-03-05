"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Utensils, Bus, Ticket, Building, ShoppingBag, MoreHorizontal } from "lucide-react";
import type { Budget } from "@prisma/client";

interface BudgetPanelProps {
  budget: Budget | null;
  currency: string;
}

const BUDGET_CATEGORIES = [
  { key: "accommodation", label: "Accommodation", icon: Building, color: "bg-purple-500" },
  { key: "food", label: "Food & Dining", icon: Utensils, color: "bg-orange-500" },
  { key: "transport", label: "Transport", icon: Bus, color: "bg-blue-500" },
  { key: "activities", label: "Activities", icon: Ticket, color: "bg-green-500" },
  { key: "shopping", label: "Shopping", icon: ShoppingBag, color: "bg-pink-500" },
  { key: "miscellaneous", label: "Miscellaneous", icon: MoreHorizontal, color: "bg-slate-500" },
] as const;

export function BudgetPanel({ budget, currency }: BudgetPanelProps) {
  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold mb-1">No budget data yet</h3>
        <p className="text-sm text-muted-foreground">
          Generate an itinerary to see the AI-calculated budget breakdown.
        </p>
      </div>
    );
  }

  const total = budget.total;

  return (
    <div className="p-4 space-y-4">
      {/* Total */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-6 text-white">
        <p className="text-sm text-white/70 mb-1">Total Estimated Budget</p>
        <p className="text-4xl font-bold">
          {currency} {total.toLocaleString()}
        </p>
        {budget.isPerPerson && (
          <p className="text-xs text-white/60 mt-1">Per person estimate</p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Breakdown by Category</h3>
        {BUDGET_CATEGORIES.map(({ key, label, icon: Icon, color }) => {
          const amount = budget[key as keyof Budget] as number ?? 0;
          const pct = total > 0 ? (amount / total) * 100 : 0;

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-md ${color} flex items-center justify-center`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <span>{label}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">
                    {currency} {amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-day average */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium">Daily average</span>
        </div>
        <p className="text-2xl font-bold text-emerald-600">
          {currency} {(total / 7).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">per day estimate</p>
      </div>
    </div>
  );
}
