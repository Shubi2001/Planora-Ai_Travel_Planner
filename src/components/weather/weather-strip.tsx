"use client";

import { format } from "date-fns";
import { Cloud, Droplets, Wind, Sun } from "lucide-react";
import type { WeatherForecast } from "@prisma/client";

interface WeatherStripProps {
  forecasts: WeatherForecast[];
  detailed?: boolean;
  loading?: boolean;
}

// Unique "Sky Atlas" palette — teal, cyan, coral (works in light + dark)
const STRIP_GRADIENT = "from-teal-100 via-cyan-50 to-indigo-100 dark:from-teal-950/95 dark:via-cyan-950/90 dark:to-indigo-950/95 border-teal-200/60 dark:border-teal-500/20";
const CARD_GRADIENT = "from-teal-500/8 via-cyan-500/5 to-transparent dark:from-teal-400/15 dark:via-cyan-400/10 border-teal-200/50 dark:border-teal-500/20";
const RAIN_BG = "bg-sky-100 dark:bg-sky-500/20 border-sky-200 dark:border-sky-500/30";
const WIND_BG = "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30";
const UV_BG = "bg-amber-100 dark:bg-amber-500/25 border-amber-200 dark:border-amber-500/40";
const WEAR_BG = "bg-rose-50 dark:bg-rose-500/15 border-rose-200/60 dark:border-rose-500/25";

function getTempColor(temp: number): string {
  if (temp >= 35) return "text-rose-600 dark:text-rose-400";
  if (temp >= 28) return "text-amber-600 dark:text-amber-400";
  if (temp >= 20) return "text-emerald-600 dark:text-emerald-400";
  if (temp >= 10) return "text-cyan-600 dark:text-cyan-400";
  return "text-sky-600 dark:text-sky-400";
}

export function WeatherStrip({ forecasts, detailed = false, loading = false }: WeatherStripProps) {
  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mx-4 my-2 bg-gradient-to-r ${STRIP_GRADIENT} border`}>
        <Cloud className="h-5 w-5 animate-pulse text-cyan-500 dark:text-cyan-400" />
        <span className="text-sm text-cyan-700 dark:text-cyan-200/80">Loading weather forecast…</span>
      </div>
    );
  }

  if (forecasts.length === 0) return null;

  if (detailed) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-base bg-gradient-to-r from-cyan-600 to-teal-600 dark:from-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
          Weather Forecast
        </h3>
        <div className="grid gap-3">
          {forecasts.map((forecast) => (
            <div
              key={forecast.id}
              className={`rounded-xl border bg-gradient-to-br ${CARD_GRADIENT} p-4 backdrop-blur-sm shadow-md`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {format(new Date(forecast.date), "EEEE, MMMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">{forecast.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl drop-shadow-sm">{forecast.icon}</span>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getTempColor(forecast.tempMax ?? 0)}`}>
                      {forecast.tempMax?.toFixed(0)}°
                    </p>
                    <p className="text-xs text-muted-foreground">{forecast.tempMin?.toFixed(0)}°</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {forecast.rainProbability != null && (
                  <div className={`rounded-lg ${RAIN_BG} border p-2 text-center`}>
                    <p className="text-sky-700 dark:text-sky-300 font-semibold flex items-center justify-center gap-1">
                      <Droplets className="h-3.5 w-3" /> {forecast.rainProbability}%
                    </p>
                    <p className="text-sky-600/80 dark:text-sky-400/70">Rain</p>
                  </div>
                )}
                {forecast.windSpeed != null && (
                  <div className={`rounded-lg ${WIND_BG} border p-2 text-center`}>
                    <p className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1">
                      <Wind className="h-3.5 w-3" /> {forecast.windSpeed?.toFixed(0)}
                    </p>
                    <p className="text-emerald-600/80 dark:text-emerald-400/70">km/h</p>
                  </div>
                )}
                {forecast.uvIndex != null && (
                  <div className={`rounded-lg ${UV_BG} border p-2 text-center`}>
                    <p className="text-amber-700 dark:text-amber-300 font-semibold flex items-center justify-center gap-1">
                      <Sun className="h-3.5 w-3" /> UV {forecast.uvIndex}
                    </p>
                    <p className="text-amber-600/80 dark:text-amber-400/70">Index</p>
                  </div>
                )}
              </div>

              {forecast.clothingSuggestion && (
                <div className={`mt-3 rounded-lg ${WEAR_BG} border px-3 py-2`}>
                  <p className="text-xs text-rose-800/90 dark:text-rose-200/90">
                    <span className="font-medium text-rose-700 dark:text-rose-300">What to wear:</span>{" "}
                    {forecast.clothingSuggestion}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 mx-4 my-2 rounded-xl bg-gradient-to-r ${STRIP_GRADIENT} border overflow-x-auto scrollbar-hide`}>
      {forecasts.slice(0, 7).map((forecast) => (
        <div
          key={forecast.id}
          className="flex items-center gap-2 shrink-0 rounded-lg px-3 py-2 bg-white/60 dark:bg-teal-900/40 border border-teal-200/50 dark:border-teal-500/20 hover:bg-white/80 dark:hover:bg-teal-800/50 transition-colors shadow-sm"
        >
          <span className="text-xl drop-shadow-sm">{forecast.icon}</span>
          <div>
            <p className="font-medium leading-none text-foreground">
              {format(new Date(forecast.date), "EEE")}
            </p>
            <p className="text-muted-foreground leading-none mt-0.5">
              <span className={getTempColor(forecast.tempMax ?? 0)}>{forecast.tempMax?.toFixed(0)}°</span>
              {" / "}
              <span className="text-muted-foreground">{forecast.tempMin?.toFixed(0)}°</span>
            </p>
          </div>
          {forecast.rainProbability != null && forecast.rainProbability > 30 && (
            <span className="text-sky-600 dark:text-sky-300 text-xs flex items-center gap-0.5">
              <Droplets className="h-3 w-3" /> {forecast.rainProbability}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
