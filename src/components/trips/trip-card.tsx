"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Calendar, Users, Camera } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import CoverPickerModal from "./cover-picker-modal";

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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  DRAFT:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ARCHIVED: "bg-muted text-muted-foreground border-input",
};

function getCoverUrl(destination: string) {
  // Picsum Photos: deterministic beautiful photos using destination as seed (no API key, no CORS issues)
  const seed = destination.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 30);
  return `https://picsum.photos/seed/${seed}/800/400`;
}

interface TripCardProps {
  trip: Trip;
  index?: number;
}

export default function TripCard({ trip, index = 0 }: TripCardProps) {
  const [coverImage, setCoverImage] = useState<string | null>(trip.coverImage ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const displayCover = coverImage ?? getCoverUrl(trip.destination);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        whileHover={{ y: -4, transition: { duration: 0.18 } }}
        className="group"
      >
        <div className="rounded-2xl border overflow-hidden hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all bg-card">
          {/* Cover image area */}
          <div className="relative h-44 overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayCover}
              alt={trip.destination}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/travel-${trip.id.slice(-4)}/800/400`;
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Status badge */}
            <div className="absolute top-3 right-3">
              <span className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border backdrop-blur-sm",
                STATUS_COLORS[trip.status] ?? STATUS_COLORS.DRAFT
              )}>
                {trip.status.toLowerCase()}
              </span>
            </div>

            {/* Change cover button — hover on desktop, always visible on mobile */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPickerOpen(true); }}
              className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 px-2.5 py-1.5 text-white text-[11px] font-medium transition-all hover:bg-black/70 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <Camera className="h-3 w-3" />
              <span className="hidden xs:inline">Change cover</span>
            </button>

            {/* Destination on image */}
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white font-semibold text-sm flex items-center gap-1.5 drop-shadow">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {trip.destination}
              </p>
            </div>
          </div>

          {/* Card body — clickable to open trip */}
          <Link href={`/trips/${trip.id}/edit`} className="block p-4 space-y-2.5">
            <h3 className="font-semibold text-sm leading-snug group-hover:text-violet-400 transition-colors line-clamp-1">
              {trip.title}
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                {format(new Date(trip.startDate), "MMM d")} –{" "}
                {format(new Date(trip.endDate), "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                {trip.groupSize} {trip.groupSize === 1 ? "person" : "people"} · {trip._count.days} days
              </div>
            </div>

            {trip.budget && trip.budget.total > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Budget:{" "}
                  <span className="font-medium text-foreground">
                    {trip.budget.currency} {trip.budget.total.toLocaleString()}
                  </span>
                </p>
              </div>
            )}
          </Link>
        </div>
      </motion.div>

      {/* Cover picker modal */}
      <CoverPickerModal
        tripId={trip.id}
        destination={trip.destination}
        currentCover={coverImage}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSaved={(url) => setCoverImage(url)}
      />
    </>
  );
}
