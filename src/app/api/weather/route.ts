import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { addHours, parseISO } from "date-fns";

const weatherQuerySchema = z.object({
  tripId: z.string().cuid(),
  latitude: z.string().transform(Number),
  longitude: z.string().transform(Number),
  startDate: z.string(),
  endDate: z.string(),
});

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    uv_index_max: number[];
  };
}

const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "☀️" },
  1: { description: "Mainly clear", icon: "🌤️" },
  2: { description: "Partly cloudy", icon: "⛅" },
  3: { description: "Overcast", icon: "☁️" },
  45: { description: "Foggy", icon: "🌫️" },
  48: { description: "Rime fog", icon: "🌫️" },
  51: { description: "Light drizzle", icon: "🌦️" },
  61: { description: "Slight rain", icon: "🌧️" },
  63: { description: "Moderate rain", icon: "🌧️" },
  65: { description: "Heavy rain", icon: "🌧️" },
  71: { description: "Slight snow", icon: "🌨️" },
  73: { description: "Moderate snow", icon: "❄️" },
  80: { description: "Rain showers", icon: "🌦️" },
  95: { description: "Thunderstorm", icon: "⛈️" },
};

function getClothingSuggestion(
  tempMin: number,
  tempMax: number,
  rainProb: number
): string {
  const suggestions: string[] = [];

  if (tempMax > 30) suggestions.push("Light, breathable clothing");
  else if (tempMax > 20) suggestions.push("Light layers");
  else if (tempMax > 10) suggestions.push("Medium layers, jacket");
  else suggestions.push("Warm coat, thermal layers");

  if (rainProb > 60) suggestions.push("Bring an umbrella or rain jacket");
  if (tempMin < 10) suggestions.push("Comfortable walking shoes");

  return suggestions.join(". ");
}

// GET /api/weather?tripId=...&latitude=...&longitude=...&startDate=...&endDate=...
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const query = weatherQuerySchema.parse(Object.fromEntries(searchParams));

    // Check cached forecasts first (valid for 3 hours)
    const cached = await db.weatherForecast.findMany({
      where: {
        tripId: query.tripId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { date: "asc" },
    });

    if (cached.length > 0) {
      return successResponse({ forecasts: cached, cached: true });
    }

    // Fetch from Open-Meteo (free, no API key needed)
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(query.latitude));
    url.searchParams.set("longitude", String(query.longitude));
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max,uv_index_max"
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("start_date", query.startDate.split("T")[0]);
    url.searchParams.set("end_date", query.endDate.split("T")[0]);

    const response = await fetch(url.toString(), { next: { revalidate: 10800 } });

    if (!response.ok) {
      return errorResponse("Weather service unavailable", 503);
    }

    const data: OpenMeteoResponse = await response.json();
    const expiresAt = addHours(new Date(), 3);

    // Delete stale forecasts and insert fresh ones
    await db.weatherForecast.deleteMany({ where: { tripId: query.tripId } });

    const forecasts = await db.$transaction(
      data.daily.time.map((date, i) => {
        const tempMin = data.daily.temperature_2m_min[i] ?? 0;
        const tempMax = data.daily.temperature_2m_max[i] ?? 0;
        const rainProb = data.daily.precipitation_probability_max[i] ?? 0;
        const wmoCode = data.daily.weathercode[i] ?? 0;
        const wmo = WMO_CODES[wmoCode] ?? { description: "Unknown", icon: "🌡️" };

        return db.weatherForecast.create({
          data: {
            tripId: query.tripId,
            date: parseISO(date),
            location: `${query.latitude},${query.longitude}`,
            latitude: query.latitude,
            longitude: query.longitude,
            tempMin,
            tempMax,
            description: wmo.description,
            icon: wmo.icon,
            humidity: null,
            windSpeed: data.daily.windspeed_10m_max[i],
            rainProbability: rainProb,
            uvIndex: data.daily.uv_index_max[i],
            clothingSuggestion: getClothingSuggestion(tempMin, tempMax, rainProb),
            expiresAt,
          },
        });
      })
    );

    return successResponse({ forecasts, cached: false });
  } catch (err) {
    return handleApiError(err);
  }
}
