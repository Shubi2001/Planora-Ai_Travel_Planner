"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useUiStore } from "@/stores/ui-store";
import { useTripStore } from "@/stores/trip-store";
import { MapPin, Loader2, Navigation } from "lucide-react";
import type { Trip, TripDay, Activity } from "@prisma/client";

type TripWithDays = Trip & {
  days: (TripDay & { activities: Activity[] })[];
};

interface TripMapProps {
  trip: TripWithDays;
}

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#f97316", ATTRACTION: "#3b82f6", HOTEL: "#8b5cf6",
  TRANSPORT: "#6b7280", SHOPPING: "#ec4899", ENTERTAINMENT: "#eab308",
  NATURE: "#22c55e", CULTURE: "#6366f1", SPORT: "#ef4444", OTHER: "#64748b",
};

const DAY_COLORS = [
  "#8b5cf6", "#3b82f6", "#ec4899", "#f97316",
  "#22c55e", "#eab308", "#ef4444", "#06b6d4",
];

interface GeocodedActivity extends Activity {
  lat: number;
  lng: number;
}

// Free Nominatim geocoding — no API key required
async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "User-Agent": "AI-Travel-Planner/1.0" } }
    );
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

export function TripMap({ trip }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Layer[]>([]);
  const polylinesRef = useRef<import("leaflet").Layer[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [activities, setActivities] = useState<(GeocodedActivity & { dayNumber: number; dayColor: string })[]>([]);
  const { selectedActivityId, selectActivity } = useUiStore();
  const currentTrip = useTripStore((s) => s.currentTrip);
  const days = currentTrip?.days ?? trip.days;

  // Geocode all activities that have a location but no coordinates
  useEffect(() => {
    const geocodeAll = async () => {
      setGeocoding(true);
      const result: (GeocodedActivity & { dayNumber: number; dayColor: string })[] = [];

      for (let di = 0; di < days.length; di++) {
        const day = days[di];
        for (const activity of day.activities) {
          // Use existing coordinates if available
          if (activity.latitude && activity.longitude) {
            result.push({ ...activity, lat: activity.latitude, lng: activity.longitude, dayNumber: day.dayNumber, dayColor: DAY_COLORS[di % DAY_COLORS.length] });
            continue;
          }
          // Try to geocode from location or title + destination
          const query = activity.location
            ? `${activity.location}, ${trip.destination}`
            : `${activity.title}, ${trip.destination}`;
          const coords = await geocode(query);
          if (coords) {
            result.push({ ...activity, lat: coords.lat, lng: coords.lng, dayNumber: day.dayNumber, dayColor: DAY_COLORS[di % DAY_COLORS.length] });
          }
        }
      }

      setActivities(result);
      setGeocoding(false);
    };

    if (days.length > 0) geocodeAll();
    else setGeocoding(false);
  }, [days, trip.destination]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || leafletMap.current) return;

      // Fix default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current, {
        center: [trip.latitude ?? 20, trip.longitude ?? 0],
        zoom: trip.latitude ? 12 : 2,
        zoomControl: true,
      });

      // CartoDB Dark Matter — free, no API key, looks great with dark UI
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;
      setLoading(false);
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add markers + route lines when activities are geocoded
  useEffect(() => {
    if (!leafletMap.current || activities.length === 0) return;

    import("leaflet").then((L) => {
      if (!leafletMap.current) return;

      // Clear old layers
      markersRef.current.forEach((m) => leafletMap.current?.removeLayer(m));
      polylinesRef.current.forEach((p) => leafletMap.current?.removeLayer(p));
      markersRef.current = [];
      polylinesRef.current = [];

      const bounds: [number, number][] = [];

      // Draw route lines per day
      const byDay = activities.reduce<Record<number, typeof activities>>((acc, a) => {
        (acc[a.dayNumber] = acc[a.dayNumber] ?? []).push(a);
        return acc;
      }, {});

      Object.entries(byDay).forEach(([_dayNum, dayActs]) => {
        if (dayActs.length < 2) return;
        const latlngs = dayActs.map((a) => [a.lat, a.lng] as [number, number]);
        const polyline = L.polyline(latlngs, {
          color: dayActs[0].dayColor,
          weight: 2.5,
          opacity: 0.7,
          dashArray: "6, 6",
        }).addTo(leafletMap.current!);
        polylinesRef.current.push(polyline);
      });

      // Add markers
      activities.forEach((activity, i) => {
        const color = CATEGORY_COLORS[activity.category] ?? "#64748b";
        const isSelected = selectedActivityId === activity.id;

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width: ${isSelected ? "40px" : "32px"};
              height: ${isSelected ? "40px" : "32px"};
              border-radius: 50%;
              background: ${color};
              border: ${isSelected ? "3px solid white" : "2px solid white"};
              box-shadow: 0 2px ${isSelected ? "16px" : "8px"} rgba(0,0,0,${isSelected ? "0.5" : "0.3"});
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              color: white;
              cursor: pointer;
              transition: all 0.15s ease;
            ">${i + 1}</div>
          `,
          iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
          iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
        });

        const marker = L.marker([activity.lat, activity.lng], { icon })
          .addTo(leafletMap.current!)
          .bindPopup(`
            <div style="min-width: 180px; font-family: system-ui;">
              <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Day ${activity.dayNumber} · ${activity.timeSlot}</div>
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${activity.title}</div>
              ${activity.location ? `<div style="font-size: 12px; color: #6b7280;">📍 ${activity.location}</div>` : ""}
              ${activity.estimatedCost ? `<div style="font-size: 12px; color: #059669; margin-top: 4px; font-weight: 500;">~${trip.currency} ${activity.estimatedCost.toLocaleString()}</div>` : ""}
              ${activity.duration ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">⏱️ ${Math.floor(activity.duration / 60)}h${activity.duration % 60 > 0 ? ` ${activity.duration % 60}m` : ""}</div>` : ""}
            </div>
          `, { closeButton: false, maxWidth: 240 });

        marker.on("click", () => selectActivity(activity.id));
        markersRef.current.push(marker);
        bounds.push([activity.lat, activity.lng]);
      });

      // Fit to all markers
      if (bounds.length > 0) {
        leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    });
  }, [activities, selectedActivityId, selectActivity, trip.currency]);

  // Fly to selected activity
  useEffect(() => {
    if (!selectedActivityId || !leafletMap.current) return;
    const found = activities.find((a) => a.id === selectedActivityId);
    if (found) {
      leafletMap.current.flyTo([found.lat, found.lng], 15, { duration: 0.8 });
    }
  }, [selectedActivityId, activities]);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />

      <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* Loading overlay */}
      {(loading || geocoding) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading map…" : `Finding locations… (${activities.length} found)`}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !geocoding && activities.length === 0 && days.length > 0 && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3 text-center px-8">
          <MapPin className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium">No locations found</p>
          <p className="text-xs text-muted-foreground">
            Activities need location names to appear on the map. Generate an itinerary or add locations to activities.
          </p>
        </div>
      )}

      {/* No itinerary state */}
      {!loading && !geocoding && days.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3 text-center px-8 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-md rounded-2xl border p-6 shadow-xl max-w-xs">
            <Navigation className="h-10 w-10 text-violet-400 mx-auto mb-3 opacity-70" />
            <p className="text-sm font-semibold">Map ready</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Click <strong className="text-foreground">"Generate AI"</strong> in the top bar to create your itinerary — activities will appear as pins with route lines.
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      {activities.length > 0 && (
        <div className="absolute bottom-4 left-4 rounded-xl bg-background/95 backdrop-blur-sm border shadow-lg p-3 max-w-[160px] z-10">
          <p className="text-[10px] font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Days</p>
          {Object.keys(
            activities.reduce<Record<number, boolean>>((acc, a) => { acc[a.dayNumber] = true; return acc; }, {})
          ).slice(0, 5).map((dayNum) => {
            const act = activities.find((a) => a.dayNumber === Number(dayNum));
            return (
              <div key={dayNum} className="flex items-center gap-2 mb-1">
                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: act?.dayColor }} />
                <span className="text-[11px] truncate">Day {dayNum}</span>
              </div>
            );
          })}
          {Object.keys(activities.reduce<Record<number, boolean>>((acc, a) => { acc[a.dayNumber] = true; return acc; }, {})).length > 5 && (
            <p className="text-[10px] text-muted-foreground">+ more days</p>
          )}
        </div>
      )}
    </div>
  );
}
