import { openai, getAIModel, getMaxTokens, getProvider } from "./client";
import {
  buildItinerarySystemPrompt,
  buildItineraryUserPrompt,
  buildRegenerateDayPrompt,
} from "./prompts";
import {
  aiItinerarySchema,
  aiDaySchema,
  type AiItinerary,
  type AiDay,
  type GenerateItineraryInput,
  type RegenerateDayInput,
} from "@/lib/validations/trip";
import { createLogger } from "@/lib/logger";
import { db } from "@/lib/db";

const log = createLogger("ai-generate");

const MAX_RETRIES = 2;

function friendlyAIError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  if (msg.includes("429") || msg.includes("rate limit")) {
    return "AI rate limit reached. Please wait a moment and try again.";
  }
  if (msg.includes("401") || msg.includes("api key") || msg.includes("incorrect")) {
    return "AI API key is missing or invalid. Please check your .env.local file.";
  }
  if (msg.includes("quota") || msg.includes("billing")) {
    return "AI quota exceeded. Check your billing or switch to a free provider (Groq).";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "AI request timed out. Please try again.";
  }
  return err instanceof Error ? err.message : "AI generation failed. Please try again.";
}

async function parseJsonWithRetry<T>(
  content: string,
  validator: (data: unknown) => T
): Promise<T> {
  const cleaned = content
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return validator(parsed);
  } catch (err) {
    log.error({ err, preview: cleaned.substring(0, 300) }, "JSON parse failed");
    throw new Error("AI returned an unexpected format. Please try again.");
  }
}

export async function generateItinerary(
  input: GenerateItineraryInput,
  userId: string
): Promise<AiItinerary> {
  const startTime = Date.now();
  const model = getAIModel();
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      log.info({ attempt, model, destination: input.destination }, "Generating itinerary");

      const completion = await openai.chat.completions.create({
        model,
        max_tokens: getMaxTokens(),
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildItinerarySystemPrompt() },
          { role: "user", content: buildItineraryUserPrompt(input) },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? "";
      const itinerary = await parseJsonWithRetry(content, (data) => aiItinerarySchema.parse(data));

      await db.aiUsageLog.create({
        data: {
          userId,
          tripId: input.tripId,
          action: "generate_itinerary",
          model,
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
          totalTokens: completion.usage?.total_tokens ?? 0,
          durationMs: Date.now() - startTime,
          success: true,
        },
      });

      await db.subscription.updateMany({
        where: { userId },
        data: { aiCallsUsed: { increment: 1 } },
      });

      return itinerary;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn({ attempt, err: lastError.message }, "Itinerary generation attempt failed");

      // Don't retry on auth/quota errors — they won't resolve with a retry
      const msg = lastError.message.toLowerCase();
      if (msg.includes("401") || msg.includes("api key") || msg.includes("quota") || msg.includes("billing")) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }

  await db.aiUsageLog.create({
    data: {
      userId,
      tripId: input.tripId,
      action: "generate_itinerary",
      model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: lastError?.message,
    },
  });

  throw new Error(friendlyAIError(lastError));
}

export async function regenerateDay(
  input: RegenerateDayInput,
  existingItinerary: {
    destination: string;
    travelStyle?: string | null;
    interests: string[];
    currency: string;
    budget?: number | null;
    groupSize: number;
  },
  userId: string
): Promise<AiDay> {
  const startTime = Date.now();
  const model = getAIModel();

  try {
      const completion = await openai.chat.completions.create({
      model,
      max_tokens: 2000,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildItinerarySystemPrompt() },
        { role: "user", content: buildRegenerateDayPrompt(input, existingItinerary) },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    const day = await parseJsonWithRetry(content, (data) => aiDaySchema.parse(data));

    await db.aiUsageLog.create({
      data: {
        userId,
        tripId: input.tripId,
        action: "regenerate_day",
        model,
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
        durationMs: Date.now() - startTime,
        success: true,
      },
    });

    await db.subscription.updateMany({
      where: { userId },
      data: { aiCallsUsed: { increment: 1 } },
    });

    return day;
  } catch (err) {
    await db.aiUsageLog.create({
      data: {
        userId,
        tripId: input.tripId,
        action: "regenerate_day",
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startTime,
        success: false,
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    throw new Error(friendlyAIError(err));
  }
}

// Streaming version — used for real-time itinerary generation UI
export async function* generateItineraryStream(
  input: GenerateItineraryInput
): AsyncGenerator<string> {
  const model = getAIModel();
  const maxTokens = getMaxTokens();
  const provider = getProvider();
  log.info({ model, maxTokens, provider, destination: input.destination }, "Starting stream generation");

  const stream = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    temperature: 0.7,
    stream: true,
    // json_object mode ensures the model always outputs valid JSON (no prose before/after)
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildItinerarySystemPrompt() },
      { role: "user", content: buildItineraryUserPrompt(input) },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) yield delta;
  }
}

export { friendlyAIError };
