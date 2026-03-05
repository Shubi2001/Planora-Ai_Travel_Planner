"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane, Hotel, Star, Wifi, Clock, ArrowRight,
  ExternalLink, Loader2, RefreshCw, MapPin, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import type { FlightOffer, HotelOffer } from "@/lib/travel/flights";
import { useUserLocation } from "@/hooks/use-user-location";
import LocationPickerModal from "@/components/location/location-picker-modal";

interface Props {
  tripId: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  currency?: string;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("h-3 w-3", i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
        />
      ))}
    </span>
  );
}

export default function FlightsHotelsPanel({ tripId, destination, startDate, endDate, currency = "USD" }: Props) {
  const [tab, setTab] = useState<"flights" | "hotels">("flights");
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [hotels, setHotels] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Use saved home location as default departure city
  const { location } = useUserLocation();
  const [origin, setOrigin] = useState("");

  const load = useCallback(async (type: "flights" | "hotels") => {
    setLoading(true);
    try {
      const qs = type === "flights" ? `type=flights&origin=${origin}` : `type=hotels`;
      const res = await fetch(`/api/trips/${tripId}/flights?${qs}`);
      const data = await res.json();
      if (type === "flights") setFlights(data.data?.flights ?? []);
      else setHotels(data.data?.hotels ?? []);
    } finally {
      setLoading(false);
    }
  }, [tripId, origin]);

  // Pre-fill origin from saved home location
  useEffect(() => {
    if (location && !origin) setOrigin(location.city);
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex border-b">
        {(["flights", "hotels"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              tab === t ? "border-b-2 border-violet-500 text-violet-400" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "flights" ? <Plane className="h-4 w-4" /> : <Hotel className="h-4 w-4" />}
            {t === "flights" ? "Flights" : "Hotels"}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="p-4 border-b bg-muted/20 space-y-2">
        {tab === "flights" ? (
          <>
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder={location ? location.city : "Your departure city"}
                  className="h-8 text-sm"
                />
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium flex-shrink-0 truncate max-w-[80px]">{destination}</span>
              </div>
              <Button size="sm" variant="outline" className="h-8 gap-1 shrink-0" onClick={() => load("flights")}>
                <RefreshCw className="h-3.5 w-3.5" /> Search
              </Button>
            </div>
            {/* Location shortcut */}
            {location ? (
              <button
                onClick={() => setOrigin(location.city)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Navigation className="h-3 w-3" />
                Use my home: {location.displayName}
              </button>
            ) : (
              <button
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-400 transition-colors"
              >
                <Navigation className="h-3 w-3" />
                Set your home city for quick departure selection
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {destination} · {format(startDate, "MMM d")} – {format(endDate, "MMM d")}
            </p>
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => load("hotels")}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!loading && tab === "flights" && (
            <motion.div key="flights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {flights.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border bg-card p-4 hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">{f.airlineCode}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{f.airline}</p>
                        <p className="text-xs text-muted-foreground">{f.flightNumber} · {f.cabinClass}</p>
                      </div>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <p className="text-sm font-medium">{format(new Date(f.departureTime), "HH:mm")}</p>
                      <p className="text-xs text-muted-foreground">{f.origin}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {f.duration}
                      </div>
                      <div className="flex items-center gap-1 w-20">
                        <div className="flex-1 h-px bg-border" />
                        <Plane className="h-3 w-3 text-muted-foreground" />
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{f.stops === 0 ? "Direct" : `${f.stops} stop`}</p>
                    </div>

                    <div className="text-center flex-shrink-0">
                      <p className="text-sm font-medium">{format(new Date(f.arrivalTime), "HH:mm")}</p>
                      <p className="text-xs text-muted-foreground">{f.destination}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-base">{f.currency} {f.price.toLocaleString()}</p>
                      <a
                        href={f.bookingUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline mt-1"
                      >
                        Book <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  {f.stops === 0 && <Badge variant="secondary" className="text-[10px] mt-2">✈ Direct flight</Badge>}
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && tab === "hotels" && (
            <motion.div key="hotels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {hotels.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border bg-card overflow-hidden hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="w-28 flex-shrink-0 bg-muted overflow-hidden">
                      <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover min-h-[100px]" loading="lazy" />
                    </div>
                    <div className="flex-1 p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm leading-tight">{h.name}</p>
                          <StarRating stars={h.stars} />
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {h.address}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold">{h.currency} {h.pricePerNight}</p>
                          <p className="text-[10px] text-muted-foreground">per night</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1 flex-wrap">
                          {h.amenities.slice(0, 3).map((a) => (
                            <Badge key={a} variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
                              {a === "Free WiFi" && <Wifi className="h-2.5 w-2.5" />} {a}
                            </Badge>
                          ))}
                        </div>
                        <a
                          href={h.bookingUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:underline flex items-center gap-1"
                        >
                          Book <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-muted-foreground pt-2">
          Prices are illustrative. Connect Amadeus or Skyscanner API for live rates.
        </p>
      </div>

      {/* Location picker modal */}
      <LocationPickerModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
    </div>
  );
}
