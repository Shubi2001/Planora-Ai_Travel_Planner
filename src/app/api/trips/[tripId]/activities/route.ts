import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:activities");

type RouteContext = { params: Promise<{ tripId: string }> };

const createActivitySchema = z.object({
  dayId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  category: z.enum(["FOOD", "ATTRACTION", "HOTEL", "TRANSPORT", "SHOPPING", "ENTERTAINMENT", "NATURE", "CULTURE", "SPORT", "OTHER"]).default("OTHER"),
  timeSlot: z.enum(["morning", "afternoon", "evening", "flexible"]).default("flexible"),
  duration: z.number().int().min(0).optional(),
  estimatedCost: z.number().min(0).default(0),
  isFree: z.boolean().default(false),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().max(500).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
});

const reorderActivitiesSchema = z.object({
  activities: z.array(
    z.object({
      id: z.string().cuid(),
      dayId: z.string().cuid(),
      sortOrder: z.number().int().min(0),
    })
  ),
});

// POST /api/trips/:tripId/activities — create activity
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;

    // Verify edit permission
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] },
                acceptedAt: { not: null },
              },
            },
          },
        ],
      },
    });

    if (!trip) return errorResponse("Trip not found or insufficient permissions", 404);

    const body = await req.json();
    const input = createActivitySchema.parse(body);

    // Verify the day belongs to this trip
    const day = await db.tripDay.findFirst({
      where: { id: input.dayId, tripId },
    });

    if (!day) return errorResponse("Day not found", 404);

    // Get current max sort order
    const maxOrder = await db.activity.aggregate({
      where: { dayId: input.dayId },
      _max: { sortOrder: true },
    });

    const activity = await db.activity.create({
      data: {
        dayId: input.dayId,
        title: input.title,
        description: input.description,
        location: input.location,
        address: input.address,
        category: input.category,
        timeSlot: input.timeSlot,
        duration: input.duration,
        estimatedCost: input.estimatedCost,
        isFree: input.isFree,
        latitude: input.latitude,
        longitude: input.longitude,
        notes: input.notes,
        websiteUrl: input.websiteUrl || null,
        isAiGenerated: false,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return successResponse({ activity }, "Activity created", 201);
  } catch (err) {
    return handleApiError(err);
  }
}

// PUT /api/trips/:tripId/activities — reorder (drag-and-drop)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;

    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] },
                acceptedAt: { not: null },
              },
            },
          },
        ],
      },
    });

    if (!trip) return errorResponse("Trip not found or insufficient permissions", 404);

    const body = await req.json();
    const { activities } = reorderActivitiesSchema.parse(body);

    // Batch update sort orders and dayIds (for cross-day moves)
    await db.$transaction(
      activities.map(({ id, dayId, sortOrder }) =>
        db.activity.update({
          where: { id },
          data: { dayId, sortOrder },
        })
      )
    );

    log.info({ tripId, count: activities.length }, "Activities reordered");
    return successResponse({ updated: activities.length }, "Activities reordered");
  } catch (err) {
    return handleApiError(err);
  }
}
