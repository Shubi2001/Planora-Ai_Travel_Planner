import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenAI, getAIModel } from "@/lib/ai/client";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import { z } from "zod";

export const runtime = "nodejs";

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
});

// GET  /api/trips/[tripId]/chat — load conversation history
export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const messages = await db.chatMessage.findMany({
    where: { tripId: params.tripId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return successResponse({ messages });
}

// POST /api/trips/[tripId]/chat — send a message, get AI response
export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);
  const userId = session.user.id;

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);
  const { message } = parsed.data;

  // Load trip with full itinerary context
  const trip = await db.trip.findFirst({
    where: {
      id: params.tripId,
      OR: [
        { userId },
        { collaborators: { some: { userId, acceptedAt: { not: null } } } },
      ],
    },
    include: {
      days: { include: { activities: { orderBy: { sortOrder: "asc" } } }, orderBy: { dayNumber: "asc" } },
      budget: true,
    },
  });

  if (!trip) return errorResponse("Trip not found", 404);

  // Fetch recent chat history (last 10 messages for context)
  const history = await db.chatMessage.findMany({
    where: { tripId: params.tripId },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  // Build a compact itinerary summary (reduces token usage by ~70%)
  const daysSummary = trip.days.map((day) =>
    `Day ${day.dayNumber} (${day.title ?? "Untitled"}): ${day.activities.map((a) => `${a.timeSlot} ${a.title}${a.location ? ` @ ${a.location}` : ""} ($${a.estimatedCost ?? 0})`).join(" | ") || "no activities yet"}`
  ).join("\n");

  const systemPrompt = `You are an expert AI travel assistant for this trip:
Trip: ${trip.title} | ${trip.destination} | ${trip.startDate ? new Date(trip.startDate).toLocaleDateString() : "TBD"} – ${trip.endDate ? new Date(trip.endDate).toLocaleDateString() : "TBD"}
Style: ${trip.travelStyle ?? "general"} | Group: ${trip.groupSize} | Budget: ${trip.currency} ${trip.totalBudget ?? "flexible"}
${daysSummary ? `\nItinerary:\n${daysSummary}` : "No itinerary yet."}

You can: suggest activity changes, answer destination questions, give budget advice, optimize scheduling.
If proposing itinerary changes, end with:
\`\`\`changes
{ "type": "itinerary_update", "description": "Brief summary", "changes": [] }
\`\`\`
Keep answers concise and helpful.`;

  // Save user message
  await db.chatMessage.create({
    data: { tripId: params.tripId, userId, role: "user", content: message },
  });

  const openai = getOpenAI();

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user" as const, content: message },
  ];

  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: getAIModel(),
      messages,
      max_tokens: 700,
      temperature: 0.7,
    });
  } catch (err: unknown) {
    // Remove the optimistic user message we already saved if AI call fails
    await db.chatMessage.deleteMany({
      where: { tripId: params.tripId, userId, role: "user", content: message },
    });

    const errMsg = err instanceof Error ? err.message : String(err);
    const lower = errMsg.toLowerCase();

    if (lower.includes("429") || lower.includes("rate limit")) {
      return errorResponse("OpenAI rate limit reached. Please wait a moment and try again.", 429);
    }
    if (lower.includes("401") || lower.includes("api key") || lower.includes("incorrect")) {
      return errorResponse("OpenAI API key is invalid. Update OPENAI_API_KEY in .env.local", 401);
    }
    if (lower.includes("quota") || lower.includes("billing")) {
      return errorResponse("OpenAI quota exceeded. Check your billing at platform.openai.com", 402);
    }
    return errorResponse("AI service error. Please try again.", 500);
  }

  const assistantContent = completion.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";

  // Extract proposed changes JSON if present
  let proposedChanges: string | null = null;
  const changesMatch = assistantContent.match(/```changes\n([\s\S]*?)\n```/);
  if (changesMatch?.[1]) {
    try {
      JSON.parse(changesMatch[1]); // validate it's valid JSON
      proposedChanges = changesMatch[1];
    } catch {
      // not valid JSON, ignore
    }
  }

  const saved = await db.chatMessage.create({
    data: {
      tripId: params.tripId,
      userId,
      role: "assistant",
      content: assistantContent,
      proposedChanges,
    },
  });

  return successResponse({ message: saved });
}

// PATCH /api/trips/[tripId]/chat — mark proposed changes as applied
export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { messageId } = await req.json();
  if (!messageId) return errorResponse("messageId required", 400);

  await db.chatMessage.update({
    where: { id: messageId },
    data: { appliedAt: new Date() },
  });

  return successResponse({}, "Changes marked as applied");
}

// DELETE /api/trips/[tripId]/chat — clear conversation history
export async function DELETE(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const trip = await db.trip.findFirst({
    where: { id: params.tripId, userId: session.user.id },
  });
  if (!trip) return errorResponse("Forbidden", 403);

  await db.chatMessage.deleteMany({ where: { tripId: params.tripId } });
  return successResponse({}, "Conversation cleared");
}
