"use client";

import { useTripStore } from "@/stores/trip-store";
import { Sparkles } from "lucide-react";

const STAGES = [
  "Researching your destination...",
  "Crafting day-by-day activities...",
  "Optimizing routes and timing...",
  "Calculating budget estimates...",
  "Adding local tips and insights...",
  "Finalizing your itinerary...",
];

export function GeneratingOverlay() {
  const { generatingProgress, generatingChunks } = useTripStore();

  const chunkCount = generatingChunks.length;
  const stageIndex = Math.min(
    Math.floor((chunkCount / 500) * STAGES.length),
    STAGES.length - 1
  );

  const progressPercent = Math.min((chunkCount / 2000) * 100, 95);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border bg-card shadow-2xl p-8 text-center">
        {/* Animated icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mb-6 animate-pulse">
          <Sparkles className="h-10 w-10 text-white" />
        </div>

        <h2 className="text-xl font-bold mb-2">Generating Your Itinerary</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {STAGES[stageIndex]}
        </p>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          This usually takes 15–30 seconds...
        </p>

        {/* Live chunk preview */}
        {generatingChunks.length > 0 && (
          <div className="mt-4 rounded-lg bg-muted p-3 text-left max-h-24 overflow-hidden">
            <p className="text-xs font-mono text-muted-foreground line-clamp-4">
              {generatingChunks.slice(-200)}
              <span className="animate-pulse">▋</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
