import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { sendCollaborationInvite } from "@/lib/email";
import { generateToken } from "@/lib/utils/password";
import { addDays } from "date-fns";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:collaborators");

type RouteContext = { params: Promise<{ tripId: string }> };

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
});

// POST /api/trips/:tripId/collaborators — invite collaborator
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;

    // Only owner/editor can invite
    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: session.user.id },
          {
            collaborators: {
              some: {
                userId: session.user.id,
                role: "OWNER",
                acceptedAt: { not: null },
              },
            },
          },
        ],
      },
    });

    if (!trip) return errorResponse("Trip not found or insufficient permissions", 404);

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    // Find invitee user
    const invitee = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Check for existing invite
    const existing = await db.tripCollaborator.findFirst({
      where: {
        tripId,
        OR: [
          ...(invitee ? [{ userId: invitee.id }] : []),
          { inviteEmail: email },
        ],
      },
    });

    if (existing?.acceptedAt) {
      return errorResponse("User is already a collaborator", 409);
    }

    const inviteToken = generateToken(24);
    const inviteExpires = addDays(new Date(), 7);

    const collaborator = invitee
      ? await db.tripCollaborator.upsert({
          where: { tripId_userId: { tripId, userId: invitee.id } },
          create: {
            tripId,
            userId: invitee.id,
            role,
            invitedBy: session.user.id,
            inviteToken,
            inviteEmail: email,
            inviteExpires,
          },
          update: {
            role,
            inviteToken,
            inviteExpires,
          },
        })
      : await db.tripCollaborator.create({
          data: {
            tripId,
            userId: session.user.id, // placeholder, updated when invite accepted
            role,
            invitedBy: session.user.id,
            inviteToken,
            inviteEmail: email,
            inviteExpires,
          },
        });

    // Send invitation email
    try {
      await sendCollaborationInvite({
        to: email,
        inviterName: session.user.name ?? "A traveler",
        tripTitle: trip.title,
        destination: trip.destination,
        token: inviteToken,
      });
    } catch (emailErr) {
      log.warn({ emailErr }, "Failed to send invitation email");
    }

    return successResponse({ collaborator, inviteToken }, "Invitation sent", 201);
  } catch (err) {
    return handleApiError(err);
  }
}

// GET /api/trips/:tripId/collaborators
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;

    const trip = await db.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { userId: session.user.id },
          { collaborators: { some: { userId: session.user.id, acceptedAt: { not: null } } } },
        ],
      },
    });

    if (!trip) return errorResponse("Trip not found", 404);

    const collaborators = await db.tripCollaborator.findMany({
      where: { tripId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { invitedAt: "asc" },
    });

    return successResponse({ collaborators });
  } catch (err) {
    return handleApiError(err);
  }
}

// DELETE /api/trips/:tripId/collaborators?userId=... — remove collaborator
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) return errorResponse("userId is required", 400);

    // Owner or self can remove
    const trip = await db.trip.findFirst({ where: { id: tripId, userId: session.user.id } });
    const isSelf = targetUserId === session.user.id;

    if (!trip && !isSelf) {
      return errorResponse("Insufficient permissions", 403);
    }

    await db.tripCollaborator.deleteMany({
      where: { tripId, userId: targetUserId },
    });

    return successResponse({ removed: true }, "Collaborator removed");
  } catch (err) {
    return handleApiError(err);
  }
}
