import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTripSchema } from "@/lib/validations/trip";
import {
  successResponse,
  errorResponse,
  handleApiError,
  AppError,
} from "@/lib/utils/api-response";
import { createLogger } from "@/lib/logger";
import { generateToken } from "@/lib/utils/password";
import { addDays } from "date-fns";

const log = createLogger("api:trips");

// GET /api/trips — list user's trips
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { userId: session.user.id },
        {
          collaborators: {
            some: { userId: session.user.id, acceptedAt: { not: null } },
          },
        },
      ],
      ...(status ? { status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" } : {}),
    };

    const [trips, total] = await Promise.all([
      db.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          _count: {
            select: { days: true, collaborators: true },
          },
          budget: {
            select: { total: true, currency: true },
          },
          collaborators: {
            where: { userId: session.user.id },
            select: { role: true },
          },
        },
      }),
      db.trip.count({ where }),
    ]);

    return successResponse({
      trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST /api/trips — create a new trip
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const userId = session.user.id;

    // Check trip limit for free users
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    if (subscription && subscription.tripsLimit !== -1) {
      const tripCount = await db.trip.count({
        where: { userId, status: { not: "ARCHIVED" } },
      });

      if (tripCount >= subscription.tripsLimit) {
        throw new AppError(
          `Free plan allows up to ${subscription.tripsLimit} active trips. Upgrade to Pro for unlimited trips.`,
          403,
          "TRIP_LIMIT_REACHED"
        );
      }
    }

    const body = await req.json();
    const input = createTripSchema.parse(body);

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new AppError("End date must be after start date", 400);
    }

    const trip = await db.trip.create({
      data: {
        userId,
        title: input.title,
        destination: input.destination,
        description: input.description,
        startDate,
        endDate,
        totalBudget: input.budget,
        currency: input.currency,
        travelStyle: input.travelStyle,
        interests: JSON.stringify(input.interests ?? []),
        groupSize: input.groupSize,
        status: "DRAFT",
        shareToken: generateToken(24),
      },
    });

    log.info({ userId, tripId: trip.id }, "Trip created");
    return successResponse({ trip }, "Trip created successfully", 201);
  } catch (err) {
    return handleApiError(err);
  }
}
