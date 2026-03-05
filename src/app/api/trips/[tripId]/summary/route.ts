import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenAI, getAIModel } from "@/lib/ai/client";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

export const runtime = "nodejs";

const FORMATS = {
  blog: {
    label: "Blog Post",
    prompt: (ctx: string) => `Write an engaging travel blog post about this trip. 
Make it personal, vivid and 300-400 words. Use markdown with headers (##).
${ctx}`,
  },
  instagram: {
    label: "Instagram Caption",
    prompt: (ctx: string) => `Write 3 Instagram caption options for this trip. 
Each caption: 2-3 sentences, emojis, 5-8 relevant hashtags, different tone (adventurous/luxurious/nostalgic).
Number them 1. 2. 3.
${ctx}`,
  },
  reel: {
    label: "Reel Script",
    prompt: (ctx: string) => `Write a 30-second Instagram/TikTok reel script for this trip.
Format: Scene-by-scene with [VISUAL] and [VOICEOVER] tags. Include hook, 4-5 scenes, CTA.
${ctx}`,
  },
  summary: {
    label: "Trip Summary",
    prompt: (ctx: string) => `Write a concise trip summary (100 words) suitable for sharing.
Include: destination highlights, key experiences, budget, and a memorable takeaway.
${ctx}`,
  },
};

export async function POST(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return errorResponse("Unauthorized", 401);

  const { format } = await req.json() as { format: keyof typeof FORMATS };
  if (!FORMATS[format]) return errorResponse("Invalid format", 400);

  const trip = await db.trip.findFirst({
    where: {
      id: params.tripId,
      OR: [
        { userId: session.user.id },
        { collaborators: { some: { userId: session.user.id, acceptedAt: { not: null } } } },
      ],
    },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: { activities: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!trip) return errorResponse("Trip not found", 404);

  const ctx = `
TRIP: ${trip.title}
DESTINATION: ${trip.destination}
DATES: ${trip.startDate?.toLocaleDateString()} – ${trip.endDate?.toLocaleDateString()}
GROUP SIZE: ${trip.groupSize}
STYLE: ${trip.travelStyle ?? "General"}
DAYS:
${trip.days.map((d) => `Day ${d.dayNumber} (${d.title}): ${d.activities.map((a) => a.title).join(", ")}`).join("\n")}
`;

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: getAIModel(),
    messages: [
      { role: "system", content: "You are a creative travel writer. Write compelling, authentic travel content." },
      { role: "user", content: FORMATS[format].prompt(ctx) },
    ],
    max_tokens: 800,
    temperature: 0.85,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  return successResponse({ content, format });
}
