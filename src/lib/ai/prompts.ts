import { format } from "date-fns";
import type { GenerateItineraryInput, RegenerateDayInput } from "@/lib/validations/trip";

export function buildItinerarySystemPrompt(): string {
  return `You are an expert travel planner with deep knowledge of global destinations, 
local customs, optimal routing, and budget management. 

Your itineraries are:
- Practical and achievable (no impossible travel times)
- Culturally sensitive and locally informed
- Budget-conscious with accurate cost estimates
- Well-paced (not cramming too many activities)
- Safety-aware

You MUST respond with valid JSON only. No markdown, no explanations outside JSON.
Follow the exact schema provided. Every field is required unless marked optional.`;
}

export function buildItineraryUserPrompt(input: GenerateItineraryInput): string {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const formattedStart = format(start, "MMMM d, yyyy");
  const formattedEnd = format(end, "MMMM d, yyyy");

  const interestsList =
    input.interests.length > 0 ? input.interests.join(", ") : "general sightseeing";
  const budgetText = input.budget
    ? `Total budget: ${input.currency} ${input.budget.toLocaleString()} for ${input.groupSize} ${input.groupSize === 1 ? "person" : "people"}`
    : "Budget: flexible";
  const styleText = input.travelStyle ? `Travel style: ${input.travelStyle}` : "";

  return `Create a detailed ${days}-day travel itinerary for:

DESTINATION: ${input.destination}
DATES: ${formattedStart} to ${formattedEnd} (${days} days)
${budgetText}
CURRENCY: ${input.currency}
GROUP SIZE: ${input.groupSize}
${styleText}
INTERESTS: ${interestsList}
${input.additionalNotes ? `SPECIAL REQUESTS: ${input.additionalNotes}` : ""}

Requirements:
1. Each day must have activities for morning, afternoon, and evening time slots
2. Include a mix of paid and free activities
3. Respect opening hours and local holidays where possible
4. Include realistic travel times between locations
5. Provide accurate GPS coordinates (latitude/longitude) for each activity
6. Budget estimates should be per-person in ${input.currency}
7. Include at least 1 food/restaurant activity per day
8. Include accommodation suggestion for each night
9. Add practical travel tips per day

Return ONLY valid JSON matching this schema exactly:
{
  "tripTitle": "string",
  "overview": "string (2-3 sentences about the trip)",
  "currency": "${input.currency}",
  "totalEstimatedCost": number,
  "budgetBreakdown": {
    "food": number,
    "transport": number,
    "activities": number,
    "accommodation": number,
    "miscellaneous": number
  },
  "generalTips": ["string"],
  "packingList": ["string"],
  "bestTimeToVisit": "string",
  "days": [
    {
      "dayNumber": number,
      "date": "YYYY-MM-DD",
      "title": "string",
      "theme": "string",
      "notes": "string",
      "dailyBudget": number,
      "travelTips": ["string"],
      "activities": [
        {
          "title": "string",
          "description": "string",
          "location": "string (place name)",
          "address": "string",
          "category": "FOOD|ATTRACTION|HOTEL|TRANSPORT|SHOPPING|ENTERTAINMENT|NATURE|CULTURE|SPORT|OTHER",
          "timeSlot": "morning|afternoon|evening|flexible",
          "duration": number (minutes),
          "estimatedCost": number (per person),
          "isFree": boolean,
          "latitude": number,
          "longitude": number,
          "tips": "string",
          "bookingRequired": boolean,
          "websiteUrl": "string or empty string"
        }
      ]
    }
  ]
}`;
}

export function buildRegenerateDayPrompt(
  input: RegenerateDayInput,
  existingItinerary: {
    destination: string;
    travelStyle?: string | null;
    interests: string[];
    currency: string;
    budget?: number | null;
    groupSize: number;
  }
): string {
  const date = format(new Date(input.date), "EEEE, MMMM d, yyyy");

  return `Regenerate day ${input.dayNumber} (${date}) of a trip to ${existingItinerary.destination}.

CONTEXT:
- Travel style: ${existingItinerary.travelStyle ?? "general"}
- Interests: ${existingItinerary.interests.join(", ") || "general sightseeing"}
- Currency: ${existingItinerary.currency}
- Group size: ${existingItinerary.groupSize}
${existingItinerary.budget ? `- Daily budget: ~${existingItinerary.currency} ${Math.round(existingItinerary.budget / 7)}` : ""}
${input.reason ? `- Reason for regeneration: ${input.reason}` : "- Provide fresh, different activities from a typical itinerary"}

Return ONLY a valid JSON object for a single day matching this schema:
{
  "dayNumber": ${input.dayNumber},
  "date": "${input.date}",
  "title": "string",
  "theme": "string",
  "notes": "string",
  "dailyBudget": number,
  "travelTips": ["string"],
  "activities": [
    {
      "title": "string",
      "description": "string",
      "location": "string",
      "address": "string",
      "category": "FOOD|ATTRACTION|HOTEL|TRANSPORT|SHOPPING|ENTERTAINMENT|NATURE|CULTURE|SPORT|OTHER",
      "timeSlot": "morning|afternoon|evening|flexible",
      "duration": number,
      "estimatedCost": number,
      "isFree": boolean,
      "latitude": number,
      "longitude": number,
      "tips": "string",
      "bookingRequired": boolean,
      "websiteUrl": "string or empty string"
    }
  ]
}`;
}
