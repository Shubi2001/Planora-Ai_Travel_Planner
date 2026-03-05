import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import { getOpenAI } from "@/lib/ai/client";
import { z } from "zod";

export const runtime = "nodejs";

const itemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().default("General"),
  quantity: z.number().int().positive().default(1),
  isEssential: z.boolean().default(false),
  notes: z.string().optional(),
});

// GET — load all packing items
export async function GET(
  _req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const items = await db.packingItem.findMany({
    where: { tripId: params.tripId },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
  });

  return successResponse({ items });
}

// POST — add item OR generate AI list
export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const body = await req.json();

  // AI-generate packing list
  if (body.action === "ai_generate") {
    const trip = await db.trip.findFirst({
      where: { id: params.tripId, userId: session.user.id },
      include: { days: { include: { activities: true } } },
    });
    if (!trip) return errorResponse("Trip not found", 404);

    const openai = getOpenAI();
    const prompt = `Generate a comprehensive packing list for this trip:
Destination: ${trip.destination}
Duration: ${trip.days.length} days
Travel Style: ${trip.travelStyle ?? "general"}
Interests: ${JSON.parse((trip.interests as string) || "[]").join(", ") || "general"}
Activities: ${trip.days.flatMap((d) => d.activities.map((a) => a.category)).join(", ")}

Return a JSON array of packing items. Each item: { name, category, quantity, isEssential }
Categories: Documents, Clothing, Toiletries, Electronics, Health, Activities, Miscellaneous
Return ONLY the JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    let aiItems: Array<{ name: string; category: string; quantity?: number; isEssential?: boolean }> = [];
    try {
      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
      aiItems = parsed.items ?? parsed;
    } catch {
      return errorResponse("AI response parsing failed", 500);
    }

    // Clear existing AI-generated items, keep user-added ones
    await db.packingItem.deleteMany({ where: { tripId: params.tripId } });

    const created = await db.packingItem.createMany({
      data: aiItems.map((item) => ({
        tripId: params.tripId,
        name: item.name,
        category: item.category ?? "General",
        quantity: item.quantity ?? 1,
        isEssential: item.isEssential ?? false,
      })),
    });

    const items = await db.packingItem.findMany({
      where: { tripId: params.tripId },
      orderBy: [{ category: "asc" }],
    });
    return successResponse({ items, generated: created.count }, "Packing list generated", 201);
  }

  // Manual add single item
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid input", 400);

  const item = await db.packingItem.create({
    data: { tripId: params.tripId, ...parsed.data },
  });
  return successResponse({ item }, "Item added", 201);
}

// PATCH — toggle packed / update item
export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { itemId, isPacked, name, quantity } = await req.json();
  if (!itemId) return errorResponse("itemId required", 400);

  const item = await db.packingItem.update({
    where: { id: itemId },
    data: {
      ...(isPacked !== undefined && { isPacked }),
      ...(name && { name }),
      ...(quantity !== undefined && { quantity }),
    },
  });
  return successResponse({ item });
}

// DELETE — remove single item
export async function DELETE(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return errorResponse("itemId required", 400);

  await db.packingItem.delete({ where: { id: itemId } });
  return successResponse({}, "Item removed");
}
