import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { regenerateDaySchema } from "@/lib/validations/trip";
import { regenerateDay } from "@/lib/ai/generate";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:regenerate-day");

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const userId = session.user.id;
    const body = await req.json();
    const input = regenerateDaySchema.parse(body);

    // Verify ownership and get trip details
    const trip = await db.trip.findFirst({
      where: {
        id: input.tripId,
        OR: [
          { userId },
          {
            collaborators: {
              some: {
                userId,
                role: { in: ["OWNER", "EDITOR"] },
              },
            },
          },
        ],
      },
    });

    if (!trip) return errorResponse("Trip not found or insufficient permissions", 404);

    const aiDay = await regenerateDay(
      input,
      {
        destination: trip.destination,
        travelStyle: trip.travelStyle,
        interests: JSON.parse(trip.interests || "[]") as string[],
        currency: trip.currency,
        budget: trip.totalBudget,
        groupSize: trip.groupSize,
      },
      userId
    );

    // Replace the day in the database
    await db.$transaction(async (tx) => {
      // Delete old activities for this day
      await tx.activity.deleteMany({ where: { dayId: input.dayId } });

      // Update day metadata
      await tx.tripDay.update({
        where: { id: input.dayId },
        data: {
          title: aiDay.title,
          notes: aiDay.notes,
          updatedAt: new Date(),
        },
      });

      // Create new activities
      for (let i = 0; i < aiDay.activities.length; i++) {
        const act = aiDay.activities[i];
        await tx.activity.create({
          data: {
            dayId: input.dayId,
            title: act.title,
            description: act.description,
            location: act.location,
            address: act.address,
            category: act.category as Parameters<typeof tx.activity.create>[0]["data"]["category"],
            timeSlot: act.timeSlot,
            duration: act.duration,
            estimatedCost: act.estimatedCost,
            isFree: act.isFree,
            latitude: act.latitude,
            longitude: act.longitude,
            notes: act.tips,
            websiteUrl: act.websiteUrl || null,
            isAiGenerated: true,
            sortOrder: i,
          },
        });
      }
    });

    log.info({ tripId: input.tripId, dayId: input.dayId }, "Day regenerated");
    return successResponse({ day: aiDay }, "Day regenerated successfully");
  } catch (err) {
    return handleApiError(err);
  }
}
