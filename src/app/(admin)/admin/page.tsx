import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Map, Sparkles, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { format, subDays } from "date-fns";

export const metadata: Metadata = { title: "Admin Panel" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Admin gate
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") redirect("/dashboard");

  const thirtyDaysAgo = subDays(new Date(), 30);

  const [
    totalUsers,
    newUsersThisMonth,
    totalTrips,
    totalAiCalls,
    proSubscriptions,
    recentAiLogs,
    topDestinations,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.trip.count(),
    db.aiUsageLog.count(),
    db.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    db.aiUsageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.trip.groupBy({
      by: ["destination"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers, sub: `+${newUsersThisMonth} this month`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Trips", value: totalTrips, sub: "all time", icon: Map, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "AI Calls", value: totalAiCalls, sub: "all time", icon: Sparkles, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Pro Subscribers", value: proSubscriptions, sub: "active", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">System analytics and monitoring</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top destinations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Destinations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDestinations.map((dest: any, i: number) => (
                <div key={dest.destination} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground/50 w-6">
                      {i + 1}
                    </span>
                    <span className="font-medium">{dest.destination}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dest._count.id} trips
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent AI calls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recent AI Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAiLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                    <p className="text-xs text-muted-foreground">
                      {log.totalTokens.toLocaleString()} tokens · {log.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block h-2 w-2 rounded-full ${log.success ? "bg-emerald-500" : "bg-destructive"}`} />
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
