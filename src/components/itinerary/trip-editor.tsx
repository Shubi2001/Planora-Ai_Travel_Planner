"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTripStore } from "@/stores/trip-store";
import { useUiStore } from "@/stores/ui-store";
import { ItineraryBuilder } from "./itinerary-builder";
import { TripHeader, type TripPanel } from "./trip-header";
import { GeneratingOverlay } from "./generating-overlay";
import { WeatherStrip } from "@/components/weather/weather-strip";
import { cn } from "@/lib/utils/cn";
import type { Trip, TripDay, Activity, TripCollaborator, User, Budget, WeatherForecast } from "@prisma/client";

const PanelLoader = () => (
  <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
    <span className="text-sm">Loading…</span>
  </div>
);

// Lazy-load every heavy panel — only downloaded when first opened
const TripMap           = dynamic(() => import("@/components/map/trip-map").then(m => ({ default: m.TripMap })), { loading: PanelLoader, ssr: false });
const BudgetPanel       = dynamic(() => import("@/components/budget/budget-panel").then(m => ({ default: m.BudgetPanel })), { loading: PanelLoader });
const ExpenseTracker    = dynamic(() => import("@/components/budget/expense-tracker"), { loading: PanelLoader });
const CollaboratorPanel = dynamic(() => import("@/components/collaboration/collaborator-panel").then(m => ({ default: m.CollaboratorPanel })), { loading: PanelLoader });
const TripChatPanel     = dynamic(() => import("./trip-chat-panel"), { loading: PanelLoader });
const PackingChecklist  = dynamic(() => import("./packing-checklist"), { loading: PanelLoader });
const FlightsHotelsPanel = dynamic(() => import("@/components/travel/flights-hotels-panel"), { loading: PanelLoader });
const TimelineView      = dynamic(() => import("./timeline-view"), { loading: PanelLoader, ssr: false });
const LiveFeedPanel     = dynamic(() => import("./live-feed-panel"), { loading: PanelLoader });
const PollsPanel        = dynamic(() => import("./polls-panel"), { loading: PanelLoader });
const EmergencyPanel    = dynamic(() => import("./emergency-panel"), { loading: PanelLoader });
const AiSummaryPanel    = dynamic(() => import("./ai-summary-panel"), { loading: PanelLoader });
const ExtrasPanel       = dynamic(() => import("./extras-panel"), { loading: PanelLoader });

type FullTrip = Trip & {
  days: (TripDay & { activities: Activity[] })[];
  budget: Budget | null;
  collaborators: (TripCollaborator & { user: Pick<User, "id" | "name" | "email" | "image"> })[];
  weatherData: WeatherForecast[];
};

interface TripEditorProps {
  trip: FullTrip;
  shouldAutoGenerate: boolean;
  userId: string;
}

const AUTO_SAVE_DELAY = 2000;

export function TripEditor({ trip, shouldAutoGenerate, userId }: TripEditorProps) {
  const { setCurrentTrip, isGenerating, isDirty, markSaved, currentTrip } = useTripStore();
  const { mapVisible } = useUiStore();
  const [activePanel, setActivePanel] = useState<TripPanel>("itinerary");

  useEffect(() => {
    setCurrentTrip(trip as Parameters<typeof setCurrentTrip>[0]);
  }, [trip, setCurrentTrip]);

  useEffect(() => {
    if (shouldAutoGenerate && trip.days.length === 0) handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isDirty || !currentTrip) return;
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/trips/${currentTrip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: currentTrip.title }),
        });
        markSaved();
      } catch { /* silent */ }
    }, AUTO_SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [isDirty, currentTrip, markSaved]);

  const handleGenerate = async () => {
    const { setGenerating, appendGeneratingChunk, resetGenerating, setCurrentTrip } = useTripStore.getState();

    // Check if OpenAI key looks like a placeholder before calling API
    const isPlaceholderKey =
      !process.env.NEXT_PUBLIC_APP_URL || // always false — just a pattern check below
      false; // real check happens server-side; we handle the 401 gracefully

    setGenerating(true, "Crafting your perfect itinerary…");

    try {
      const res = await fetch("/api/ai/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.totalBudget,
          currency: trip.currency,
          travelStyle: trip.travelStyle,
          interests: JSON.parse((trip.interests as string) || "[]") as string[],
          groupSize: trip.groupSize,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = (err as { error?: string }).error ?? "";

        // Friendly message for missing/invalid OpenAI key
        if (res.status === 401 || errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("incorrect api key")) {
          toast.error(
            "OpenAI API key is missing or invalid. Add a real key to OPENAI_API_KEY in your .env.local file.",
            { duration: 8000, description: "Get a key at platform.openai.com/api-keys" }
          );
        } else if (res.status === 429) {
          toast.error("AI rate limit reached. Please wait a moment and try again.", { duration: 5000 });
        } else {
          toast.error(errMsg || "Generation failed. Please try again.");
        }
        resetGenerating();
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { resetGenerating(); return; }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n\n").filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: { error?: string; chunk?: string; done?: boolean };
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          if (data.error) {
            const errMsg = data.error;
            if (errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("incorrect")) {
              toast.error("OpenAI API key is invalid. Please update OPENAI_API_KEY in .env.local", {
                duration: 8000,
                description: "Get yours at platform.openai.com/api-keys",
              });
            } else {
              toast.error(errMsg);
            }
            resetGenerating();
            return;
          }
          if (data.chunk) appendGeneratingChunk(data.chunk);
          if (data.done) {
            const tripRes = await fetch(`/api/trips/${trip.id}`);
            if (tripRes.ok) {
              const { data: { trip: updated } } = await tripRes.json();
              setCurrentTrip(updated);
            }
            toast.success("Itinerary generated! ✈️");
            resetGenerating();
          }
        }
      }
    } catch {
      toast.error("Generation failed. Check your internet connection and try again.");
      resetGenerating();
    }

    void isPlaceholderKey; // suppress unused var
  };

  if (!currentTrip) return null;

  return (
    <div className="flex flex-col h-full">
      <TripHeader
        trip={currentTrip}
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />

      <div className={cn("flex flex-1 overflow-hidden", mapVisible && "md:divide-x")}>
        {/* Left panel — full width on mobile, fixed 480px on desktop when map is visible */}
        <div className={cn("flex flex-col overflow-hidden", mapVisible ? "w-full md:w-[480px] md:shrink-0" : "flex-1")}>
          {/* Weather strip shown on itinerary tab only */}
          {activePanel === "itinerary" && (currentTrip.weatherData?.length ?? 0) > 0 && (
            <WeatherStrip forecasts={currentTrip.weatherData ?? []} />
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex-1 overflow-y-auto"
            >
              {activePanel === "itinerary" && (
                <ItineraryBuilder trip={currentTrip} userId={userId} />
              )}

              {activePanel === "chat" && (
                <div className="h-full flex flex-col" style={{ minHeight: "calc(100vh - 140px)" }}>
                  <TripChatPanel tripId={currentTrip.id} />
                </div>
              )}

              {activePanel === "budget" && (
                <div className="divide-y">
                  <BudgetPanel budget={currentTrip.budget ?? null} currency={currentTrip.currency} />
                  <ExpenseTracker tripId={currentTrip.id} budget={currentTrip.budget as { total: number; currency: string; food: number; transport: number; activities: number; accommodation: number; shopping: number; miscellaneous: number } | null} />
                </div>
              )}

              {activePanel === "packing" && (
                <PackingChecklist tripId={currentTrip.id} />
              )}

              {activePanel === "flights" && (
                <FlightsHotelsPanel
                  tripId={currentTrip.id}
                  destination={currentTrip.destination}
                  startDate={new Date(currentTrip.startDate)}
                  endDate={new Date(currentTrip.endDate)}
                  currency={currentTrip.currency}
                />
              )}

              {activePanel === "weather" && (
                <div className="p-4">
                  <WeatherStrip forecasts={currentTrip.weatherData ?? []} detailed />
                </div>
              )}

              {activePanel === "collaboration" && (
                <CollaboratorPanel tripId={currentTrip.id} collaborators={currentTrip.collaborators ?? []} />
              )}

              {activePanel === "timeline" && (
                <TimelineView trip={currentTrip} />
              )}

              {activePanel === "feed" && (
                <LiveFeedPanel
                  destination={currentTrip.destination}
                  startDate={currentTrip.startDate ? new Date(currentTrip.startDate) : new Date()}
                  endDate={currentTrip.endDate ? new Date(currentTrip.endDate) : new Date()}
                />
              )}

              {activePanel === "polls" && (
                <PollsPanel tripId={currentTrip.id} />
              )}

              {activePanel === "emergency" && (
                <EmergencyPanel destination={currentTrip.destination} />
              )}

              {activePanel === "summary" && (
                <AiSummaryPanel tripId={currentTrip.id} />
              )}

              {activePanel === "extras" && (
                <ExtrasPanel trip={currentTrip} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Map — hidden on mobile, shown on md+ when toggled */}
        {mapVisible && (
          <div className="hidden md:flex flex-1 relative">
            <TripMap trip={currentTrip} />
          </div>
        )}
      </div>

      {isGenerating && <GeneratingOverlay />}
    </div>
  );
}
