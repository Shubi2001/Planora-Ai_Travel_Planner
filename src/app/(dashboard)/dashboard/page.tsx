import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentTrips } from "@/components/dashboard/recent-trips";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UsageMeter } from "@/components/dashboard/usage-meter";

// These components read localStorage or use Date.now() — must be client-only to prevent hydration mismatch
const TripCountdown      = dynamic(() => import("@/components/dashboard/trip-countdown"),        { ssr: false });
const LocationSetupBanner = dynamic(() => import("@/components/location/location-setup-banner"), { ssr: false });
const LocationHeaderWidget = dynamic(() => import("@/components/location/location-header-widget"), { ssr: false });

export const metadata: Metadata = { title: "Dashboard — Planora" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [trips, subscription, aiUsageCount, tripCount] = await Promise.all([
    db.trip.findMany({
      where: {
        OR: [
          { userId },
          { collaborators: { some: { userId, acceptedAt: { not: null } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        destination: true,
        startDate: true,
        endDate: true,
        status: true,
        coverImage: true,
        travelStyle: true,
        groupSize: true,
        currency: true,
        totalBudget: true,
        updatedAt: true,
        _count: { select: { days: true } },
        budget: { select: { total: true, currency: true } },
      },
    }),
    db.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, aiCallsLimit: true, aiCallsUsed: true, tripsLimit: true },
    }),
    db.aiUsageLog.count({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
    }),
    db.trip.count({ where: { userId } }),
  ]);

  const upcomingTrips = trips.filter((t) => new Date(t.startDate) > new Date());

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-8 max-w-7xl mx-auto">
      {/* Location setup banner */}
      <LocationSetupBanner />

      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0]} ✈️
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Ready to plan your next adventure?
          </p>
        </div>
        <LocationHeaderWidget />
      </div>

      {/* Countdown widget */}
      {upcomingTrips.length > 0 && (
        <TripCountdown trips={upcomingTrips.map((t) => ({
          id: t.id,
          title: t.title,
          destination: t.destination,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
        }))} />
      )}

      {/* Stats Row */}
      <DashboardStats
        tripCount={tripCount}
        aiCallsUsed={aiUsageCount}
        aiCallsLimit={subscription?.aiCallsLimit ?? 10}
        plan={(subscription?.plan as "FREE" | "PRO") ?? "FREE"}
      />

      <div className="grid lg:grid-cols-3 gap-5 md:gap-8">
        {/* Recent trips */}
        <div className="lg:col-span-2">
          <RecentTrips trips={trips} />
        </div>

        {/* Right column */}
        <div className="space-y-5 md:space-y-6">
          <QuickActions />
          <UsageMeter subscription={subscription} />
        </div>
      </div>
    </div>
  );
}
