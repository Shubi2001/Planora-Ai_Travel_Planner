import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { successResponse, errorResponse, handleApiError } from "@/lib/utils/api-response";
import { generateToken } from "@/lib/utils/password";

type RouteContext = { params: Promise<{ tripId: string }> };

const shareSchema = z.object({
  isPublic: z.boolean(),
});

// POST /api/trips/:tripId/share — enable/disable public sharing
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { tripId } = await context.params;

    const trip = await db.trip.findFirst({
      where: { id: tripId, userId: session.user.id },
    });

    if (!trip) return errorResponse("Trip not found", 404);

    const body = await req.json();
    const { isPublic } = shareSchema.parse(body);

    const updated = await db.trip.update({
      where: { id: tripId },
      data: {
        isPublic,
        shareToken: isPublic ? (trip.shareToken ?? generateToken(16)) : null,
      },
    });

    const shareUrl = isPublic
      ? `${process.env.NEXT_PUBLIC_APP_URL}/share/${updated.shareToken}`
      : null;

    return successResponse({
      isPublic: updated.isPublic,
      shareToken: updated.shareToken,
      shareUrl,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
