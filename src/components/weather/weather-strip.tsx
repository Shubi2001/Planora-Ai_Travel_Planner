"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import type { WeatherForecast } from "@prisma/client";

interface WeatherStripProps {
  forecasts: WeatherForecast[];
  detailed?: boolean;
}

export function WeatherStrip({ forecasts, detailed = false }: WeatherStripProps) {
  if (forecasts.length === 0) return null;

  if (detailed) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-base">Weather Forecast</h3>
        <div className="grid gap-3">
          {forecasts.map((forecast) => (
            <div
              key={forecast.id}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(forecast.date), "EEEE, MMMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">{forecast.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{forecast.icon}</span>
                  <div className="text-right">
                    <p className="font-bold">{forecast.tempMax?.toFixed(0)}°</p>
                    <p className="text-xs text-muted-foreground">{forecast.tempMin?.toFixed(0)}°</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {forecast.rainProbability != null && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2 text-center">
                    <p className="text-blue-700 dark:text-blue-300 font-semibold">
                      💧 {forecast.rainProbability}%
                    </p>
                    <p className="text-muted-foreground">Rain</p>
                  </div>
                )}
                {forecast.windSpeed != null && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/30 p-2 text-center">
                    <p className="font-semibold">💨 {forecast.windSpeed?.toFixed(0)}</p>
                    <p className="text-muted-foreground">km/h</p>
                  </div>
                )}
                {forecast.uvIndex != null && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2 text-center">
                    <p className="text-amber-700 dark:text-amber-300 font-semibold">
                      ☀️ UV {forecast.uvIndex}
                    </p>
                    <p className="text-muted-foreground">Index</p>
                  </div>
                )}
              </div>

              {forecast.clothingSuggestion && (
                <div className="mt-3 rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs">
                    👗 <span className="font-medium">What to wear:</span>{" "}
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
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b overflow-x-auto scrollbar-hide">
      {forecasts.slice(0, 7).map((forecast) => (
        <div
          key={forecast.id}
          className="flex items-center gap-2 shrink-0 rounded-lg px-3 py-1.5 bg-background border text-xs"
        >
          <span className="text-base">{forecast.icon}</span>
          <div>
            <p className="font-medium leading-none">
              {format(new Date(forecast.date), "EEE")}
            </p>
            <p className="text-muted-foreground leading-none mt-0.5">
              {forecast.tempMax?.toFixed(0)}° / {forecast.tempMin?.toFixed(0)}°
            </p>
          </div>
          {forecast.rainProbability != null && forecast.rainProbability > 30 && (
            <span className="text-blue-500 text-xs">💧{forecast.rainProbability}%</span>
          )}
        </div>
      ))}
    </div>
  );
}
