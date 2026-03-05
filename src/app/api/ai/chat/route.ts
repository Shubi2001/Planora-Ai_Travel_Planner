import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenAI, getAIModel } from "@/lib/ai/client";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import { z } from "zod";
import { format } from "date-fns";

export const runtime = "nodejs";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

function buildTripsContext(userId: string): Promise<string> {
  return db.trip.findMany({
    where: {
      OR: [
        { userId },
        { collaborators: { some: { userId, acceptedAt: { not: null } } } },
      ],
    },
    orderBy: { startDate: "asc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          activities: { orderBy: { sortOrder: "asc" } },
        },
      },
      savedFlights: true,
      savedHotels: true,
      budget: true,
    },
  }).then((trips) => {
    if (trips.length === 0) {
      return "The user has no trips yet in this app.";
    }

    const lines: string[] = [];
    for (const t of trips) {
      const start = format(new Date(t.startDate), "MMM d, yyyy");
      const end = format(new Date(t.endDate), "MMM d, yyyy");
      const daysCount = t.days.length;
      lines.push(`\n--- TRIP: "${t.title}" (${t.destination}) ---`);
      lines.push(`Dates: ${start} to ${end}`);
      lines.push(`Status: ${t.status}`);
      if (t.totalBudget) lines.push(`Budget: ${t.currency} ${t.totalBudget}`);
      if (t.travelStyle) lines.push(`Style: ${t.travelStyle}`);
      if (t.groupSize) lines.push(`Group: ${t.groupSize} people`);

      if (t.days.length > 0) {
        lines.push(`Itinerary (${daysCount} days):`);
        for (const d of t.days) {
          const dayDate = format(new Date(d.date), "MMM d");
          lines.push(`  Day ${d.dayNumber} (${dayDate})${d.title ? ` — ${d.title}` : ""}:`);
          for (const a of d.activities) {
            const loc = a.location ? ` @ ${a.location}` : "";
            const cost = a.estimatedCost != null ? ` (${a.currency ?? t.currency} ${a.estimatedCost})` : "";
            lines.push(`    - ${a.timeSlot}: ${a.title}${loc}${cost}`);
          }
        }
      }

      if (t.savedFlights.length > 0) {
        lines.push("Flights:");
        for (const f of t.savedFlights) {
          const dep = format(new Date(f.departureTime), "MMM d, HH:mm");
          const arr = format(new Date(f.arrivalTime), "MMM d, HH:mm");
          lines.push(`  - ${f.origin} → ${f.destination}: ${dep} to ${arr}${f.airline ? ` (${f.airline})` : ""}`);
        }
      }

      if (t.savedHotels.length > 0) {
        lines.push("Hotels:");
        for (const h of t.savedHotels) {
          const checkIn = format(new Date(h.checkIn), "MMM d");
          const checkOut = format(new Date(h.checkOut), "MMM d");
          lines.push(`  - ${h.name} (${checkIn} – ${checkOut})${h.address ? ` @ ${h.address}` : ""}`);
        }
      }
    }

    return "The user has the following trips in this Planora app. Use this data when they ask about 'my trips', 'my itinerary', 'which trip am I going on', dates, stops, flights, hotels, etc.:\n" + lines.join("\n");
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);
  const { message, history = [] } = parsed.data;

  try {
    const tripsContext = await buildTripsContext(session.user.id);

    const systemPrompt = `You are Planora, a friendly AI travel assistant built into this app. You have access to the user's trip data.

${tripsContext}

You help users:
- Answer questions about THEIR trips (dates, destinations, stops, activities, flights, hotels)
- Plan new trips across India (Ladakh, Rajasthan, Kerala, Goa, Himachal, Uttarakhand, etc.)
- Suggest destinations, itineraries, best times to visit
- Give travel tips, packing advice, budget estimates
- Answer questions about Indian cities, culture, food, transport

When the user asks about "my trips", "my itinerary", "which trip", "when does my trip start/end", "what are the stops", "flights for my trip", etc., use the trip data above to answer. Be specific with dates, places, and activities.

Keep responses concise, helpful, and practical. Use Indian Rupees (₹) when discussing costs. Be warm and encouraging.`;

    const openai = getOpenAI();
    const model = getAIModel();

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "I couldn't generate a response. Please try again.";

    return successResponse({ message: reply });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    if (err.status === 429) return errorResponse("AI rate limit reached. Please wait a moment.", 429);
    if (err.status === 401) return errorResponse("AI service is not configured. Check your API keys.", 401);
    return errorResponse(err.message ?? "Chat failed", 500);
  }
}
