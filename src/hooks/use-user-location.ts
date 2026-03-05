"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  displayName: string; // e.g. "Mumbai, India"
}

const STORAGE_KEY = "ai_travel_user_location";
const DISMISSED_KEY = "ai_travel_location_dismissed";

// Reverse geocode lat/lng → city + country using Nominatim (free, no key)
async function reverseGeocode(lat: number, lng: number): Promise<UserLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "AI-Travel-Planner/1.0" } }
    );
    const data = await res.json();
    if (!data?.address) return null;

    const city =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.county ||
      data.address.state ||
      "Unknown";
    const country = data.address.country ?? "";
    const countryCode = (data.address.country_code ?? "").toUpperCase();

    return {
      city,
      country,
      countryCode,
      lat,
      lng,
      displayName: country ? `${city}, ${country}` : city,
    };
  } catch {
    return null;
  }
}

// Forward geocode city name → coordinates
export async function geocodeCity(cityName: string): Promise<UserLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "AI-Travel-Planner/1.0" } }
    );
    const data = await res.json();
    if (!data?.[0]) return null;

    const item = data[0];
    const addr = item.address ?? {};
    const city =
      addr.city || addr.town || addr.village || addr.county || addr.state || cityName;
    const country = addr.country ?? "";
    const countryCode = (addr.country_code ?? "").toUpperCase();

    return {
      city,
      country,
      countryCode,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: country ? `${city}, ${country}` : city,
    };
  } catch {
    return null;
  }
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setLocation(JSON.parse(saved));
        return;
      }
      // Show banner for new users (only if not previously dismissed)
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) setShowBanner(true);
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((loc: UserLocation) => {
    setLocation(loc);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
    setShowBanner(false);
  }, []);

  const dismiss = useCallback(() => {
    setShowBanner(false);
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const clear = useCallback(() => {
    setLocation(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DISMISSED_KEY);
    } catch { /* ignore */ }
    setShowBanner(true);
  }, []);

  // Request browser GPS → reverse geocode → save
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation.");
      return null;
    }
    setLoading(true);
    setError(null);

    return new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLoading(false);
          if (result) {
            save(result);
            resolve(result);
          } else {
            setError("Could not determine your city. Try typing it manually.");
            resolve(null);
          }
        },
        (err) => {
          setLoading(false);
          if (err.code === 1) {
            setError("Location access denied. You can type your city manually below.");
          } else {
            setError("Could not get your location. Please type your city manually.");
          }
          resolve(null);
        },
        { timeout: 10000, maximumAge: 60_000 }
      );
    });
  }, [save]);

  // Set location by typing a city name
  const setByCity = useCallback(async (cityName: string) => {
    if (!cityName.trim()) return null;
    setLoading(true);
    setError(null);
    const result = await geocodeCity(cityName);
    setLoading(false);
    if (result) {
      save(result);
      return result;
    } else {
      setError(`Could not find "${cityName}". Please try a more specific name.`);
      return null;
    }
  }, [save]);

  return {
    location,
    loading,
    error,
    showBanner,
    detectLocation,
    setByCity,
    save,
    dismiss,
    clear,
  };
}
