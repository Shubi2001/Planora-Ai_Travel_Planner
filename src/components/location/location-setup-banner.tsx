"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserLocation } from "@/hooks/use-user-location";

export default function LocationSetupBanner() {
  const { showBanner, loading, error, detectLocation, setByCity, dismiss } = useUserLocation();
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await setByCity(manualInput.trim());
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/60 to-indigo-950/60 backdrop-blur-sm p-5 mb-6 overflow-hidden"
        >
          {/* decorative glow */}
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="shrink-0 h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-violet-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground">Set your home location</h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                We&apos;ll use this to suggest nearby flights, show travel times, and personalise trip suggestions.
              </p>

              {error && (
                <p className="text-xs text-amber-400 mb-3">{error}</p>
              )}

              {!showManual ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="gradient"
                    className="gap-2 text-xs"
                    onClick={() => detectLocation()}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Navigation className="h-3.5 w-3.5" />
                    )}
                    {loading ? "Detecting…" : "Use my current location"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-xs"
                    onClick={() => setShowManual(true)}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Type my city
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-sm">
                  <Input
                    autoFocus
                    placeholder="e.g. Mumbai, London, New York…"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" type="submit" variant="gradient" disabled={loading} className="shrink-0">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Set"}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => { setShowManual(false); setManualInput(""); }}
                  >
                    Cancel
                  </Button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
