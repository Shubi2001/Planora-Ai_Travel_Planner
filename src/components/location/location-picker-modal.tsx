"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Search, Loader2, CheckCircle, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserLocation, type UserLocation } from "@/hooks/use-user-location";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Popular cities across India for quick selection
const POPULAR_CITIES = [
  "Mumbai, India", "Delhi, India", "Bangalore, India", "Chennai, India",
  "Kolkata, India", "Hyderabad, India", "Pune, India", "Ahmedabad, India",
  "Jaipur, India", "Lucknow, India", "Kochi, India", "Goa, India",
  "Chandigarh, India", "Indore, India", "Coimbatore, India", "Nagpur, India",
  "Ladakh, India", "Shimla, India", "Manali, India", "Rishikesh, India",
  "Udaipur, India", "Jodhpur, India", "Varanasi, India", "Mysore, India",
];

export default function LocationPickerModal({ open, onClose }: Props) {
  const { location, loading, error, detectLocation, setByCity, clear } = useUserLocation();
  const [query, setQuery] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(""); setSuccess(false); }
  }, [open]);

  const handleDetect = async () => {
    const result = await detectLocation();
    if (result) { setSuccess(true); setTimeout(onClose, 1200); }
  };

  const handleSetCity = async (city: string) => {
    const result = await setByCity(city);
    if (result) { setSuccess(true); setTimeout(onClose, 1200); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSetCity(query);
  };

  const handleClear = () => {
    clear();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed inset-x-4 top-[10vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">Your Home Location</h2>
                  <p className="text-xs text-muted-foreground">Used for flight suggestions &amp; travel times</p>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current location display */}
              {location && (
                <div className="flex items-center gap-3 rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-violet-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Current location</p>
                    <p className="font-medium text-sm truncate">{location.displayName}</p>
                  </div>
                  <button
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Success message */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3"
                >
                  <CheckCircle className="h-4 w-4" />
                  Location saved! Closing…
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">{error}</p>
              )}

              {/* GPS detect button */}
              <Button
                variant="outline"
                className="w-full gap-2 justify-start"
                onClick={handleDetect}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-violet-400" />}
                {loading ? "Detecting your location…" : "Use my current GPS location"}
              </Button>

              {/* Manual search */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Or search for a city</p>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-9"
                      placeholder="Type your city…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" variant="gradient" disabled={loading || !query.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
                  </Button>
                </form>
              </div>

              {/* Popular cities */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Popular cities</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSetCity(city)}
                      disabled={loading}
                      className="rounded-full border px-3 py-1 text-xs hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-400 transition-all disabled:opacity-50"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
