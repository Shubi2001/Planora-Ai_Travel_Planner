"use client";

import { motion } from "framer-motion";
import { Map, Sparkles, TrendingUp, Crown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface DashboardStatsProps {
  tripCount: number;
  aiCallsUsed: number;
  aiCallsLimit: number;
  plan: "FREE" | "PRO";
}

export function DashboardStats({ tripCount, aiCallsUsed, aiCallsLimit, plan }: DashboardStatsProps) {
  const stats = [
    {
      label: "Active Trips",
      value: tripCount,
      icon: Map,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "AI Calls This Month",
      value: aiCallsLimit === -1 ? `${aiCallsUsed} / ∞` : `${aiCallsUsed} / ${aiCallsLimit}`,
      icon: Sparkles,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Plan",
      value: plan,
      icon: Crown,
      color: plan === "PRO" ? "text-amber-500" : "text-slate-400",
      bg: plan === "PRO" ? "bg-amber-500/10" : "bg-slate-500/10",
      border: plan === "PRO" ? "border-amber-500/20" : "border-slate-500/20",
    },
    {
      label: "Countries Planned",
      value: tripCount > 0 ? Math.min(tripCount, 12) : 0,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className={cn(
            "rounded-2xl border p-5 bg-card/60 backdrop-blur-sm cursor-default",
            stat.border
          )}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </div>
            <div className={cn("rounded-xl p-3", stat.bg)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
