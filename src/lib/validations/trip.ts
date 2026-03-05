import { z } from "zod";

export const travelStyleEnum = z.enum([
  "adventure",
  "luxury",
  "budget",
  "family",
  "solo",
  "couple",
  "group",
  "business",
]);

export const interestEnum = z.enum([
  "food",
  "history",
  "culture",
  "nature",
  "shopping",
  "nightlife",
  "art",
  "sports",
  "beaches",
  "mountains",
  "architecture",
  "photography",
  "wildlife",
  "music",
  "wellness",
]);

export const createTripSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title too long"),
  destination: z.string().min(2, "Destination is required").max(100),
  startDate: z.string().min(1, "Start date is required").or(z.date()),
  endDate: z.string().min(1, "End date is required").or(z.date()),
  // budget is truly optional — empty input sends undefined, not NaN
  budget: z.number().min(0).optional().nullable().transform((v) =>
    v == null || (typeof v === "number" && isNaN(v)) ? undefined : v
  ),
  currency: z.string().default("USD"),
  travelStyle: travelStyleEnum.optional(),
  interests: z.array(interestEnum).max(10).default([]),
  groupSize: z.number().int().min(1).max(50).default(1),
  description: z.string().max(500).optional(),
});

export const updateTripSchema = createTripSchema.partial().extend({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  isPublic: z.boolean().optional(),
});

export const generateItinerarySchema = z.object({
  tripId: z.string().min(1), // relaxed from .cuid() — Prisma may use cuid2 format
  destination: z.string().min(1),
  startDate: z.string().or(z.date().transform((d) => d.toISOString())),
  endDate: z.string().or(z.date().transform((d) => d.toISOString())),
  budget: z.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  travelStyle: travelStyleEnum.optional().nullable(),
  interests: z.array(z.string()).default([]),
  groupSize: z.number().int().min(1).default(1),
  additionalNotes: z.string().max(500).optional(),
});

export const regenerateDaySchema = z.object({
  tripId: z.string().cuid(),
  dayId: z.string().cuid(),
  dayNumber: z.number().int().min(1),
  date: z.string(),
  reason: z.string().max(200).optional(),
});

// Valid category values — normalize anything the AI returns
const VALID_CATEGORIES = ["FOOD", "ATTRACTION", "HOTEL", "TRANSPORT", "SHOPPING", "ENTERTAINMENT", "NATURE", "CULTURE", "SPORT", "OTHER"] as const;
const CATEGORY_MAP: Record<string, typeof VALID_CATEGORIES[number]> = {
  food: "FOOD", restaurant: "FOOD", dining: "FOOD", meal: "FOOD", eat: "FOOD",
  attraction: "ATTRACTION", sightseeing: "ATTRACTION", sight: "ATTRACTION", landmark: "ATTRACTION", museum: "ATTRACTION", temple: "ATTRACTION",
  hotel: "HOTEL", accommodation: "HOTEL", lodge: "HOTEL", hostel: "HOTEL", resort: "HOTEL",
  transport: "TRANSPORT", transportation: "TRANSPORT", travel: "TRANSPORT", transfer: "TRANSPORT",
  shopping: "SHOPPING", market: "SHOPPING", shop: "SHOPPING",
  entertainment: "ENTERTAINMENT", show: "ENTERTAINMENT", performance: "ENTERTAINMENT", event: "ENTERTAINMENT",
  nature: "NATURE", park: "NATURE", garden: "NATURE", hike: "NATURE", trek: "NATURE",
  culture: "CULTURE", cultural: "CULTURE", art: "CULTURE", gallery: "CULTURE",
  sport: "SPORT", sports: "SPORT", adventure: "SPORT", activity: "SPORT",
};

function normalizeCategory(raw: unknown): typeof VALID_CATEGORIES[number] {
  if (typeof raw !== "string") return "OTHER";
  const upper = raw.toUpperCase() as typeof VALID_CATEGORIES[number];
  if (VALID_CATEGORIES.includes(upper)) return upper;
  const lower = raw.toLowerCase();
  return CATEGORY_MAP[lower] ?? "OTHER";
}

function normalizeTimeSlot(raw: unknown): "morning" | "afternoon" | "evening" | "flexible" {
  if (typeof raw !== "string") return "flexible";
  const lower = raw.toLowerCase();
  if (["morning", "afternoon", "evening", "flexible"].includes(lower)) {
    return lower as "morning" | "afternoon" | "evening" | "flexible";
  }
  if (lower.includes("morn") || lower.includes("am")) return "morning";
  if (lower.includes("after") || lower.includes("noon")) return "afternoon";
  if (lower.includes("even") || lower.includes("night") || lower.includes("pm")) return "evening";
  return "flexible";
}

// Zod schema for AI-generated activity — lenient to handle Groq/GPT variations
export const aiActivitySchema = z.object({
  title: z.string().default("Activity"),
  description: z.string().default(""),
  location: z.string().default(""),
  address: z.string().optional().default(""),
  category: z.unknown().transform(normalizeCategory),
  timeSlot: z.unknown().transform(normalizeTimeSlot),
  duration: z.coerce.number().min(15).max(480).default(60),
  estimatedCost: z.coerce.number().min(0).default(0),
  isFree: z.union([z.boolean(), z.string().transform((s) => s === "true" || s === "false" ? s === "true" : false)]).default(false),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  tips: z.string().optional().default(""),
  bookingRequired: z.boolean().default(false),
  websiteUrl: z.string().optional().default("").transform((v) => {
    try { new URL(v); return v; } catch { return ""; }
  }),
});

export const aiDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  date: z.string().default(""),
  title: z.string().default("Day"),
  theme: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  activities: z.array(aiActivitySchema).default([]),
  dailyBudget: z.coerce.number().min(0).default(0),
  travelTips: z.array(z.string()).default([]),
});

export const aiItinerarySchema = z.object({
  tripTitle: z.string().default("My Trip"),
  overview: z.string().optional().default(""),
  days: z.array(aiDaySchema).min(1),
  totalEstimatedCost: z.coerce.number().min(0).default(0),
  budgetBreakdown: z.object({
    food: z.coerce.number().default(0),
    transport: z.coerce.number().default(0),
    activities: z.coerce.number().default(0),
    accommodation: z.coerce.number().default(0),
    miscellaneous: z.coerce.number().default(0),
  }).default({ food: 0, transport: 0, activities: 0, accommodation: 0, miscellaneous: 0 }),
  generalTips: z.array(z.string()).default([]),
  packingList: z.array(z.string()).default([]),
  bestTimeToVisit: z.string().optional().default(""),
  currency: z.string().default("USD"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type GenerateItineraryInput = z.infer<typeof generateItinerarySchema>;
export type RegenerateDayInput = z.infer<typeof regenerateDaySchema>;
export type AiItinerary = z.infer<typeof aiItinerarySchema>;
export type AiDay = z.infer<typeof aiDaySchema>;
export type AiActivity = z.infer<typeof aiActivitySchema>;
