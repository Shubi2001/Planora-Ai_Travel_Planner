"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Clock, MapPin, DollarSign, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Trip, TripDay, Activity } from "@prisma/client";

type TripWithDays = Trip & { days: (TripDay & { activities: Activity[] })[] };

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ATTRACTION: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  HOTEL: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  TRANSPORT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  SHOPPING: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  ENTERTAINMENT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  NATURE: "bg-green-500/20 text-green-400 border-green-500/30",
  CULTURE: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  OTHER: "bg-muted text-muted-foreground border-input",
};

const TIME_SLOT_ICONS: Record<string, string> = {
  morning: "🌅", afternoon: "☀️", evening: "🌙", flexible: "⏰",
};

export default function TimelineView({ trip }: { trip: TripWithDays }) {
  const handlePrint = () => window.print();

  const handleExportText = () => {
    let text = `${trip.title}\n${trip.destination}\n`;
    text += `${trip.startDate ? format(new Date(trip.startDate), "MMM d, yyyy") : ""} – ${trip.endDate ? format(new Date(trip.endDate), "MMM d, yyyy") : ""}\n\n`;
    trip.days.forEach((day) => {
      text += `DAY ${day.dayNumber}: ${day.title ?? ""}\n`;
      day.activities.forEach((a) => {
        text += `  ${TIME_SLOT_ICONS[a.timeSlot] ?? "•"} ${a.timeSlot.toUpperCase()} — ${a.title}`;
        if (a.location) text += ` (${a.location})`;
        if (a.estimatedCost && a.estimatedCost > 0) text += ` · ${trip.currency} ${a.estimatedCost}`;
        text += "\n";
        if (a.description) text += `     ${a.description}\n`;
      });
      text += "\n";
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${trip.title.replace(/\s+/g, "-")}-itinerary.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20 print:hidden">
        <p className="text-sm font-medium">{trip.days.length} days · {trip.destination}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleExportText}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {trip.days.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <Clock className="h-8 w-8 opacity-30" />
            Generate an AI itinerary to see the timeline view
          </div>
        ) : (
          trip.days.map((day, di) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: di * 0.05 }}
            >
              {/* Day header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-violet-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {day.dayNumber}
                </div>
                <div>
                  <p className="font-semibold text-sm">{day.title ?? `Day ${day.dayNumber}`}</p>
                  {day.date && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {/* Activities timeline */}
              <div className="ml-4 border-l-2 border-violet-500/20 space-y-0">
                {day.activities.map((activity, ai) => (
                  <div key={activity.id} className="relative pl-6 pb-5 last:pb-0">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute left-[-7px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background",
                      activity.timeSlot === "morning" ? "bg-amber-400" :
                      activity.timeSlot === "afternoon" ? "bg-orange-400" :
                      activity.timeSlot === "evening" ? "bg-violet-400" : "bg-blue-400"
                    )} />

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: di * 0.05 + ai * 0.03 }}
                      className="rounded-xl border bg-card p-3 space-y-2 hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{TIME_SLOT_ICONS[activity.timeSlot]}</span>
                            <p className="font-medium text-sm truncate">{activity.title}</p>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] h-4 px-1.5 shrink-0", CATEGORY_COLORS[activity.category] ?? CATEGORY_COLORS.OTHER)}
                            >
                              {activity.category}
                            </Badge>
                          </div>
                          {activity.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {activity.location}
                            </p>
                          )}
                        </div>
                        {activity.estimatedCost != null && activity.estimatedCost > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-400 shrink-0">
                            <DollarSign className="h-3 w-3" />
                            {activity.estimatedCost}
                          </div>
                        )}
                      </div>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      {activity.duration && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {activity.duration} min
                        </p>
                      )}
                    </motion.div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; }
        }
      `}</style>
    </div>
  );
}
