"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plane, Calendar, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageQuery?: string;
}

interface Props {
  trips: Trip[];
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3rem]">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold tabular-nums"
      >
        {String(value).padStart(2, "0")}
      </motion.span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

function Separator() {
  return <span className="text-xl font-bold text-muted-foreground pb-3">:</span>;
}

export default function TripCountdown({ trips }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Find the next upcoming trip
  const upcoming = trips
    .filter((t) => !isPast(new Date(t.startDate)))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  if (!upcoming) {
    // Show currently ongoing trip if exists
    const ongoing = trips.find(
      (t) => !isPast(new Date(t.startDate)) === false && !isPast(new Date(t.endDate))
    );
    if (ongoing) {
      const daysLeft = differenceInDays(new Date(ongoing.endDate), now);
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-card to-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Plane className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold">{ongoing.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ongoing.destination}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0">✈ In progress</Badge>
              <p className="text-xs text-muted-foreground mt-1">{daysLeft}d remaining</p>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  }

  const start = new Date(upcoming.startDate);
  const totalSeconds = differenceInSeconds(start, now);
  const days = differenceInDays(start, now);
  const hours = differenceInHours(start, now) % 24;
  const minutes = differenceInMinutes(start, now) % 60;
  const seconds = totalSeconds % 60;

  const seed = upcoming.destination.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 30);
  const unsplashUrl = `https://picsum.photos/seed/${seed}/800/300`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${unsplashUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />

      <div className="relative p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Next Trip</span>
            </div>
            <h3 className="font-bold text-lg leading-tight">{upcoming.title}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {upcoming.destination}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div className="flex items-center gap-1 justify-end">
              <Calendar className="h-3 w-3" />
              {format(start, "MMM d, yyyy")}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className={cn("flex items-end gap-1", days > 99 ? "opacity-80" : "")}>
          <CountdownUnit value={days} label="days" />
          <Separator />
          <CountdownUnit value={hours} label="hrs" />
          <Separator />
          <CountdownUnit value={minutes} label="min" />
          <Separator />
          <CountdownUnit value={seconds} label="sec" />
        </div>

        <Link
          href={`/trips/${upcoming.id}/edit`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View itinerary <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.div>
  );
}
