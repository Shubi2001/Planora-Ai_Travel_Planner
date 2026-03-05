import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

export const runtime = "nodejs";

// POST — toggle upvote
export async function POST(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);
  const userId = session.user.id;

  // Check trip is public
  const trip = await db.trip.findFirst({
    where: { id: params.tripId, isPublic: true },
  });
  if (!trip) return errorResponse("Trip not found or not public", 404);

  const existing = await db.tripVote.findUnique({
    where: { tripId_userId: { tripId: params.tripId, userId } },
  });

  if (existing) {
    // Remove vote
    await db.$transaction([
      db.tripVote.delete({ where: { tripId_userId: { tripId: params.tripId, userId } } }),
      db.trip.update({ where: { id: params.tripId }, data: { voteCount: { decrement: 1 } } }),
    ]);
    return successResponse({ voted: false, voteCount: Math.max(0, trip.voteCount - 1) });
  } else {
    // Add vote
    await db.$transaction([
      db.tripVote.create({ data: { tripId: params.tripId, userId } }),
      db.trip.update({ where: { id: params.tripId }, data: { voteCount: { increment: 1 } } }),
    ]);
    return successResponse({ voted: true, voteCount: trip.voteCount + 1 });
  }
}
