import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenAI, getAIModel } from "@/lib/ai/client";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const trip = await db.trip.findFirst({
    where: { id: params.tripId, userId: session.user.id },
  });
  if (!trip) return errorResponse("Trip not found", 404);

  // Use AI to suggest ideal Unsplash search keywords for the destination
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: getAIModel(),
    messages: [
      {
        role: "system",
        content: "You are a photographer. Return ONLY a comma-separated list of 3-5 descriptive photography keywords for a travel cover image. No explanation.",
      },
      {
        role: "user",
        content: `Best photography keywords for: ${trip.destination}, ${trip.travelStyle ?? "travel"} style trip`,
      },
    ],
    max_tokens: 60,
    temperature: 0.7,
  });

  const keywords = completion.choices[0]?.message?.content?.trim() ?? trip.destination;
  const keyword = keywords.split(",")[0]?.trim() ?? trip.destination;
  const seed = keyword.toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 40);

  // Use picsum.photos — deterministic, no API key, never 503
  const coverUrl = `https://picsum.photos/seed/${seed}/1600/900`;

  // Save to trip
  await db.trip.update({
    where: { id: trip.id },
    data: { coverImage: coverUrl },
  });

  return successResponse({ coverUrl, keywords });
}

// PATCH /api/trips/[tripId]/cover — save any cover image URL directly
export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { coverImage } = await req.json() as { coverImage: string };
  if (!coverImage || typeof coverImage !== "string") {
    return errorResponse("coverImage URL is required", 400);
  }

  const trip = await db.trip.findFirst({
    where: { id: params.tripId, userId: session.user.id },
  });
  if (!trip) return errorResponse("Trip not found", 404);

  await db.trip.update({
    where: { id: trip.id },
    data: { coverImage },
  });

  return successResponse({ coverImage });
}
