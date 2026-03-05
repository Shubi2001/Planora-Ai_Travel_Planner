import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateTripSchema } from "@/lib/validations/trip";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:trip");

type RouteContext = { params: Promise<{ tripId: string }> };

async function getTripWithPermission(
  tripId: string,
  userId: string,
  requiredRole?: "EDITOR" | "OWNER"
) {
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      OR: [
        { userId },
        {
          collaborators: {
            some: {
              userId,
              acceptedAt: { not: null },
              ...(requiredRole
                ? { role: { in: requiredRole === "EDITOR" ? ["OWNER", "EDITOR"] : ["OWNER"] } }
                : {}),
            },
          },
        },
      ],
    },
    include: {
      days: {
        orderBy: { sortOrder: "asc" },
        include: {
          activities: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      budget: true,
      collaborators: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
      weatherData: {
        orderBy: { date: "asc" },
      },
    },
  });

  return trip;
}

// GET /api/trips/:tripId
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;
    const trip = await getTripWithPermission(tripId, session.user.id);

    if (!trip) return errorResponse("Trip not found", 404);

    return successResponse({ trip });
  } catch (err) {
    return handleApiError(err);
  }
}

// PATCH /api/trips/:tripId
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;
    const trip = await getTripWithPermission(tripId, session.user.id, "EDITOR");
    if (!trip) return errorResponse("Trip not found or insufficient permissions", 404);

    const body = await req.json();
    const input = updateTripSchema.parse(body);

    // Create a version snapshot before updating
    const latestVersion = await db.tripVersion.findFirst({
      where: { tripId },
      orderBy: { version: "desc" },
    });

    await db.tripVersion.create({
      data: {
        tripId,
        version: (latestVersion?.version ?? 0) + 1,
        snapshot: trip as unknown as string,
        changedBy: session.user.id,
        changeNote: "Trip updated",
      },
    });

    const updated = await db.trip.update({
      where: { id: tripId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.destination && { destination: input.destination }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.startDate && { startDate: new Date(input.startDate) }),
        ...(input.endDate && { endDate: new Date(input.endDate) }),
        ...(input.budget !== undefined && { totalBudget: input.budget }),
        ...(input.currency && { currency: input.currency }),
        ...(input.travelStyle && { travelStyle: input.travelStyle }),
        ...(input.interests && { interests: JSON.stringify(input.interests) }),
        ...(input.groupSize && { groupSize: input.groupSize }),
        ...(input.status && { status: input.status }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
      },
    });

    log.info({ tripId, userId: session.user.id }, "Trip updated");
    return successResponse({ trip: updated }, "Trip updated");
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/trips/:tripId
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;

    // Only owner can delete
    const trip = await db.trip.findFirst({
      where: { id: tripId, userId: session.user.id },
    });

    if (!trip) return errorResponse("Trip not found or insufficient permissions", 404);

    await db.trip.delete({ where: { id: tripId } });

    log.info({ tripId, userId: session.user.id }, "Trip deleted");
    return successResponse({ deleted: true }, "Trip deleted");
  } catch (err) {
    return handleApiError(err);
  }
}
