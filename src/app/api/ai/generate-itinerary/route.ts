import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateItinerarySchema, aiItinerarySchema } from "@/lib/validations/trip";
import { generateItineraryStream, friendlyAIError } from "@/lib/ai/generate";
import {
  errorResponse,
  handleApiError,
  AppError,
} from "@/lib/utils/api-response";
import { createLogger } from "@/lib/logger";
import { addDays, format } from "date-fns";

const log = createLogger("api:generate-itinerary");

export const maxDuration = 180; // 3 minutes for AI generation (Groq can be slower for large outputs)

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Check subscription limits
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return errorResponse("Subscription not found", 404);
    }

    // Reset monthly counter if needed
    const now = new Date();
    if (subscription.aiCallsReset < new Date(now.getFullYear(), now.getMonth(), 1)) {
      await db.subscription.update({
        where: { userId },
        data: { aiCallsUsed: 0, aiCallsReset: now },
      });
    }

    if (
      subscription.aiCallsLimit !== -1 &&
      subscription.aiCallsUsed >= subscription.aiCallsLimit
    ) {
      throw new AppError(
        `AI call limit reached (${subscription.aiCallsLimit}/month). Upgrade to Pro for unlimited AI generation.`,
        429,
        "AI_LIMIT_REACHED"
      );
    }

    const body = await req.json();
    const input = generateItinerarySchema.parse(body);

    // Verify trip belongs to user
    const trip = await db.trip.findFirst({
      where: { id: input.tripId, userId },
    });

    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    log.info({ userId, tripId: input.tripId, destination: input.destination }, "Starting itinerary generation stream");

    // Return a streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";

        try {
          // Stream chunks to the client in real time
          for await (const chunk of generateItineraryStream(input)) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }

          if (!fullContent.trim()) {
            throw new Error("AI returned an empty response. Please try again.");
          }

          // Step 1: Extract JSON — find first '{' and last '}' to handle
          // any text the model outputs before/after the JSON object
          let rawParsed: unknown;
          try {
            const jsonStart = fullContent.indexOf("{");
            const jsonEnd = fullContent.lastIndexOf("}");

            if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
              log.warn({ contentLength: fullContent.length, preview: fullContent.substring(0, 200) }, "No JSON object found in AI response");
              throw new Error("no json found");
            }

            rawParsed = JSON.parse(fullContent.slice(jsonStart, jsonEnd + 1));
          } catch (parseErr) {
            log.error({ parseErr, contentLength: fullContent.length, preview: fullContent.substring(0, 300) }, "JSON.parse failed on AI response");
            throw new Error(
              "AI returned an incomplete response. Please try again — if your trip is very long (7+ days), try 3–5 days first."
            );
          }

          // Step 2: Validate & normalize with Zod — this fixes category case,
          // timeSlot variations, missing optional fields, etc.
          let itinerary: ReturnType<typeof aiItinerarySchema.parse>;
          try {
            itinerary = aiItinerarySchema.parse(rawParsed);
          } catch (zodErr) {
            log.error({ zodErr, rawKeys: rawParsed && typeof rawParsed === "object" ? Object.keys(rawParsed) : [] }, "Zod validation failed on AI response");
            // Try to use raw data as fallback if it has 'days'
            const raw = rawParsed as Record<string, unknown>;
            if (!raw?.days || !Array.isArray(raw.days) || raw.days.length === 0) {
              throw new Error("AI response is missing itinerary days. Please try again.");
            }
            // Force-parse with partial schema — better to show something than nothing
            itinerary = aiItinerarySchema.parse({
              tripTitle: raw.tripTitle ?? raw.title ?? "My Trip",
              days: raw.days,
              totalEstimatedCost: raw.totalEstimatedCost ?? 0,
              budgetBreakdown: raw.budgetBreakdown ?? { food: 0, transport: 0, activities: 0, accommodation: 0, miscellaneous: 0 },
              generalTips: raw.generalTips ?? [],
              packingList: raw.packingList ?? [],
              currency: raw.currency ?? input.currency ?? "USD",
            });
          }

          await persistItinerary(input.tripId, itinerary, userId);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, tripId: input.tripId })}\n\n`)
          );
        } catch (err) {
          log.error({ err }, "Stream generation failed");
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: friendlyAIError(err) })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

async function persistItinerary(
  tripId: string,
  itinerary: {
    tripTitle: string;
    days: Array<{
      dayNumber: number;
      date: string;
      title: string;
      notes: string;
      activities: Array<{
        title: string;
        description: string;
        location: string;
        address?: string;
        category: string;
        timeSlot: string;
        duration: number;
        estimatedCost: number;
        isFree: boolean;
        latitude?: number | null;
        longitude?: number | null;
        tips?: string;
        websiteUrl?: string;
      }>;
    }>;
    totalEstimatedCost: number;
    budgetBreakdown: {
      food: number;
      transport: number;
      activities: number;
      accommodation: number;
      miscellaneous: number;
    };
  },
  userId: string
) {
  // Delete existing days and activities
  await db.tripDay.deleteMany({ where: { tripId } });

  // Create all days and activities in a transaction
  await db.$transaction(async (tx) => {
    // Update trip title and metadata
    await tx.trip.update({
      where: { id: tripId },
      data: {
        title: itinerary.tripTitle,
        generatedAt: new Date(),
        aiModel: process.env.OPENAI_MODEL ?? "gpt-4o",
      },
    });

    // Create days with activities
    for (const day of itinerary.days) {
      const tripDay = await tx.tripDay.create({
        data: {
          tripId,
          dayNumber: day.dayNumber,
          date: new Date(day.date),
          title: day.title,
          notes: day.notes,
          sortOrder: day.dayNumber - 1,
        },
      });

      for (let i = 0; i < day.activities.length; i++) {
        const act = day.activities[i];
        await tx.activity.create({
          data: {
            dayId: tripDay.id,
            title: act.title || "Activity",
            description: act.description || "",
            location: act.location || "",
            address: act.address || null,
            // Zod already normalized category — cast is safe
            category: (act.category || "OTHER") as Parameters<typeof tx.activity.create>[0]["data"]["category"],
            timeSlot: act.timeSlot || "flexible",
            duration: Number(act.duration) || 60,
            estimatedCost: Number(act.estimatedCost) || 0,
            isFree: Boolean(act.isFree),
            latitude: act.latitude != null ? Number(act.latitude) : undefined,
            longitude: act.longitude != null ? Number(act.longitude) : undefined,
            notes: act.tips || null,
            websiteUrl: act.websiteUrl || null,
            isAiGenerated: true,
            sortOrder: i,
          },
        });
      }
    }

    // Upsert budget
    await tx.budget.upsert({
      where: { tripId },
      create: {
        tripId,
        total: itinerary.totalEstimatedCost,
        food: itinerary.budgetBreakdown.food,
        transport: itinerary.budgetBreakdown.transport,
        activities: itinerary.budgetBreakdown.activities,
        accommodation: itinerary.budgetBreakdown.accommodation,
        miscellaneous: itinerary.budgetBreakdown.miscellaneous,
      },
      update: {
        total: itinerary.totalEstimatedCost,
        food: itinerary.budgetBreakdown.food,
        transport: itinerary.budgetBreakdown.transport,
        activities: itinerary.budgetBreakdown.activities,
        accommodation: itinerary.budgetBreakdown.accommodation,
        miscellaneous: itinerary.budgetBreakdown.miscellaneous,
      },
    });
  });

  log.info({ tripId, userId }, "Itinerary persisted to database");
}
