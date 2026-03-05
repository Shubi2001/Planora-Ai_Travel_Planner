"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TripCard from "@/components/trips/trip-card";

type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  status: string;
  coverImage?: string | null;
  travelStyle?: string | null;
  groupSize: number;
  currency: string;
  totalBudget?: number | null;
  _count: { days: number };
  budget?: { total: number; currency: string } | null;
};

interface RecentTripsProps {
  trips: Trip[];
}

export function RecentTrips({ trips }: RecentTripsProps) {
  if (trips.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-dashed p-10 text-center space-y-4"
      >
        <div className="text-4xl">🗺️</div>
        <div>
          <p className="font-semibold text-lg">No trips yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first AI-powered itinerary in seconds.
          </p>
        </div>
        <Button asChild>
          <Link href="/trips/new">
            <PlusCircle className="h-4 w-4 mr-2" /> Plan a Trip
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Your Trips</h2>
        <Link href="/trips" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {trips.map((trip, i) => (
          <TripCard key={trip.id} trip={trip} index={i} />
        ))}
      </div>
    </div>
  );
}
