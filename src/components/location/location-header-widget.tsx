"use client";

import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useUserLocation } from "@/hooks/use-user-location";
import LocationPickerModal from "./location-picker-modal";

export default function LocationHeaderWidget() {
  const { location } = useUserLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-input bg-card/60 px-3 py-2 text-sm hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
        title="Change home location"
      >
        <MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        <span className="text-sm font-medium max-w-[160px] truncate">
          {location ? location.displayName : "Set your location"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      <LocationPickerModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
