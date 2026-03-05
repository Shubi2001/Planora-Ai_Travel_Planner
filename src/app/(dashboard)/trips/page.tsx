import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import TripCard from "@/components/trips/trip-card";

export const metadata: Metadata = { title: "My Trips — Planora" };

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const trips = await db.trip.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        {
          collaborators: {
            some: { userId: session.user.id, acceptedAt: { not: null } },
          },
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
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
      _count: { select: { days: true, collaborators: true } },
      budget: { select: { total: true, currency: true } },
      collaborators: {
        where: { userId: session.user.id },
        select: { role: true },
      },
    },
  });

  const STATUS_VARIANTS: Record<string, "success" | "warning" | "secondary"> = {
    ACTIVE: "success",
    DRAFT: "warning",
    ARCHIVED: "secondary",
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">My Trips</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
            {trips.length} {trips.length === 1 ? "trip" : "trips"}
          </p>
        </div>
        <Button asChild variant="gradient" size="sm" className="gap-1.5">
          <Link href="/trips/new">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Trip</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {/* Trips grid */}
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="font-semibold text-lg mb-2">No trips yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">
            Create your first AI-powered travel itinerary in seconds.
          </p>
          <Button asChild variant="gradient" className="gap-2">
            <Link href="/trips/new">
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {trips.map((trip, i) => (
            <TripCard
              key={trip.id}
              index={i}
              trip={{
                id: trip.id,
                title: trip.title,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                status: trip.status,
                coverImage: trip.coverImage,
                travelStyle: trip.travelStyle,
                groupSize: trip.groupSize,
                currency: trip.currency,
                totalBudget: trip.totalBudget,
                _count: trip._count,
                budget: trip.budget,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
