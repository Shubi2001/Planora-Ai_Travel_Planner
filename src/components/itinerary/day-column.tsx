"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Plus, RefreshCw, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityCard } from "./activity-card";
import { cn } from "@/lib/utils/cn";
import { useTripStore } from "@/stores/trip-store";
import type { TripDay, Activity } from "@prisma/client";

type DayWithActivities = TripDay & { activities: Activity[] };

interface DayColumnProps {
  day: DayWithActivities;
  tripId: string;
  currency: string;
  isOver: boolean;
}

const TIME_SLOTS = ["morning", "afternoon", "evening"] as const;
const SLOT_LABELS: Record<string, string> = {
  morning: "🌅 Morning",
  afternoon: "☀️ Afternoon",
  evening: "🌙 Evening",
  flexible: "🕐 Flexible",
};

export function DayColumn({ day, tripId, currency, isOver }: DayColumnProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { setCurrentTrip } = useTripStore();

  const { setNodeRef } = useDroppable({ id: day.id });

  const totalCost = day.activities.reduce((sum, a) => sum + (a.estimatedCost ?? 0), 0);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const trip = useTripStore.getState().currentTrip;
      if (!trip) return;

      const res = await fetch("/api/ai/regenerate-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          dayId: day.id,
          dayNumber: day.dayNumber,
          date: day.date,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Regeneration failed");
        return;
      }

      // Reload full trip
      const tripRes = await fetch(`/api/trips/${tripId}`);
      if (tripRes.ok) {
        const { data: { trip: updated } } = await tripRes.json();
        setCurrentTrip(updated);
      }

      toast.success(`Day ${day.dayNumber} regenerated!`);
    } catch {
      toast.error("Failed to regenerate day");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-all duration-150",
        isOver && "border-primary/50 bg-primary/5 shadow-sm"
      )}
    >
      {/* Day header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {day.dayNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{day.title ?? `Day ${day.dayNumber}`}</h3>
              {totalCost > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  ~{currency} {totalCost.toLocaleString()}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(day.date), "EEEE, MMMM d")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            title="Regenerate this day"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRegenerating && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Activities */}
      {!collapsed && (
        <div ref={setNodeRef} className="p-3 space-y-2 min-h-[60px]">
          {TIME_SLOTS.map((slot) => {
            const slotActivities = day.activities.filter((a) => a.timeSlot === slot);
            if (slotActivities.length === 0) return null;

            return (
              <div key={slot}>
                <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">
                  {SLOT_LABELS[slot]}
                </p>
                <div className="space-y-1.5">
                  {slotActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      tripId={tripId}
                      currency={currency}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Flexible activities */}
          {day.activities.filter((a) => a.timeSlot === "flexible").length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground font-medium px-1 mb-1.5">
                {SLOT_LABELS.flexible}
              </p>
              {day.activities
                .filter((a) => a.timeSlot === "flexible")
                .map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    tripId={tripId}
                    currency={currency}
                  />
                ))}
            </div>
          )}

          {day.activities.length === 0 && (
            <div className="flex items-center justify-center h-16 rounded-lg border border-dashed text-xs text-muted-foreground">
              Drop activities here
            </div>
          )}
        </div>
      )}
    </div>
  );
}
