"use client";

import { useEffect, useCallback } from "react";
import { geocodeCity } from "./use-user-location";
import { useTripStore } from "@/stores/trip-store";
import type { WeatherForecast } from "@prisma/client";

interface TripForWeather {
  id: string;
  destination: string;
  startDate: Date | string;
  endDate: Date | string;
  latitude?: number | null;
  longitude?: number | null;
  weatherData?: WeatherForecast[];
}

export function useWeatherFetch(trip: TripForWeather | null) {
  const { setWeatherData, setWeatherLoading } = useTripStore();

  const fetchWeather = useCallback(async () => {
    if (!trip?.id) return;

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    setWeatherLoading(true);

    let lat = trip.latitude ?? null;
    let lng = trip.longitude ?? null;

    if (lat == null || lng == null) {
      const geocoded = await geocodeCity(trip.destination);
      if (!geocoded) {
        setWeatherLoading(false);
        return;
      }
      lat = geocoded.lat;
      lng = geocoded.lng;
    }

    const params = new URLSearchParams({
      tripId: trip.id,
      latitude: String(lat),
      longitude: String(lng),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    try {
      const res = await fetch(`/api/weather?${params}`);
      if (!res.ok) {
        setWeatherLoading(false);
        return;
      }
      const json = await res.json();
      const forecasts = json?.data?.forecasts ?? [];
      if (forecasts.length > 0) setWeatherData(forecasts);
      else setWeatherLoading(false);
    } catch {
      setWeatherLoading(false);
    }
  }, [trip?.id, trip?.destination, trip?.startDate, trip?.endDate, trip?.latitude, trip?.longitude, setWeatherData, setWeatherLoading]);

  useEffect(() => {
    if (!trip) return;
    const hasWeather = (trip.weatherData?.length ?? 0) > 0;
    if (!hasWeather) void fetchWeather();
  }, [trip?.id, trip?.weatherData?.length, fetchWeather]);
}
