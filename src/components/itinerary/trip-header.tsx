"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import {
  ArrowLeft, Sparkles, Map, BarChart3, CloudSun, Users,
  MessageSquare, Package, Plane, Clock, Globe,
  BarChart2, Shield, Layers, Sun, Moon, Camera,
} from "lucide-react";
import { ShareTripMenu } from "@/components/shared/share-trip-menu";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/ui-store";
import { useTripStore } from "@/stores/trip-store";
import { cn } from "@/lib/utils/cn";
import dynamic from "next/dynamic";
import type { Trip, TripDay, Activity } from "@prisma/client";

const CoverPickerModal = dynamic(() => import("@/components/trips/cover-picker-modal"), { ssr: false });

type TripWithDays = Trip & { days: (TripDay & { activities: Activity[] })[] };

export type TripPanel = "itinerary" | "budget" | "weather" | "collaboration" | "chat" | "packing" | "flights" | "timeline" | "feed" | "polls" | "emergency" | "summary" | "extras";

interface TripHeaderProps {
  trip: TripWithDays;
  activePanel: TripPanel;
  onPanelChange: (p: TripPanel) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PANELS: { key: TripPanel; icon: React.ElementType; label: string; group?: string }[] = [
  { key: "itinerary",     icon: Map,          label: "Itinerary" },
  { key: "timeline",      icon: Clock,         label: "Timeline" },
  { key: "chat",          icon: MessageSquare, label: "AI Chat" },
  { key: "summary",       icon: Sparkles,      label: "AI Summary" },
  { key: "budget",        icon: BarChart3,     label: "Budget" },
  { key: "packing",       icon: Package,       label: "Packing" },
  { key: "flights",       icon: Plane,         label: "Flights" },
  { key: "weather",       icon: CloudSun,      label: "Weather" },
  { key: "feed",          icon: Globe,         label: "Live Feed" },
  { key: "polls",         icon: BarChart2,     label: "Polls" },
  { key: "collaboration", icon: Users,         label: "Collab" },
  { key: "emergency",     icon: Shield,        label: "Emergency" },
  { key: "extras",        icon: Layers,        label: "More" },
];

export function TripHeader({ trip, activePanel, onPanelChange, onGenerate, isGenerating }: TripHeaderProps) {
  const { mapVisible, toggleMap } = useUiStore();
  const { isDirty, lastSavedAt } = useTripStore();
  const { theme, setTheme } = useTheme();
  const [coverOpen, setCoverOpen] = useState(false);

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b gap-2">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0">
          <Button asChild variant="ghost" size="sm" className="gap-1 -ml-1.5 flex-shrink-0 px-2">
            <Link href="/trips">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Trips</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />
          <div className="min-w-0">
            <h1 className="font-semibold text-sm md:text-base leading-tight truncate max-w-[130px] sm:max-w-[200px] md:max-w-none">{trip.title}</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {trip.destination} · {format(new Date(trip.startDate), "MMM d")}–{format(new Date(trip.endDate), "MMM d")}
            </p>
          </div>
          {isDirty && <Badge variant="warning" className="text-xs flex-shrink-0 hidden sm:flex">Unsaved</Badge>}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost" size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 hidden sm:flex"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCoverOpen(true)} className="h-8 w-8 hidden md:flex" title="Change cover">
            <Camera className="h-4 w-4" />
          </Button>
          <ShareTripMenu
            tripId={trip.id}
            tripTitle={trip.title}
            destination={trip.destination}
          />
          <Button variant="ghost" size="icon" onClick={toggleMap} className="h-8 w-8 hidden sm:flex" title={mapVisible ? "Hide map" : "Show map"}>
            <Map className={cn("h-4 w-4", mapVisible && "text-violet-500")} />
          </Button>
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="gap-1 bg-violet-600 hover:bg-violet-700 text-white px-2.5 md:px-3 text-xs md:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">{isGenerating ? "Generating…" : (trip.days?.length ?? 0) > 0 ? "Regen" : "Generate"}</span>
            <span className="xs:hidden">{isGenerating ? "…" : "AI"}</span>
          </Button>
        </div>
      </div>

      {/* Panel tabs — horizontally scrollable */}
      <div className="flex items-center gap-0 px-1 md:px-3 overflow-x-auto scrollbar-hide">
        {PANELS.map((panel) => (
          <button
            key={panel.key}
            onClick={() => onPanelChange(panel.key)}
            className={cn(
              "flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap flex-shrink-0",
              activePanel === panel.key
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <panel.icon className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
            <span className="hidden sm:inline">{panel.label}</span>
            <span className="sm:hidden">{panel.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Cover picker modal */}
      <CoverPickerModal
        tripId={trip.id}
        destination={trip.destination}
        currentCover={trip.coverImage ?? null}
        open={coverOpen}
        onClose={() => setCoverOpen(false)}
        onSaved={() => setCoverOpen(false)}
      />
    </div>
  );
}
