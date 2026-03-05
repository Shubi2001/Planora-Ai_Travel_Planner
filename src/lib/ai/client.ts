import OpenAI from "openai";

// Supported providers — Groq is completely free, no credit card needed
// Get a free Groq key in 30 seconds at: https://console.groq.com/keys
type Provider = "groq" | "openai";

function detectProvider(): Provider {
  const groqKey = process.env.GROQ_API_KEY ?? "";
  if (groqKey && !groqKey.startsWith("gsk_placeholder") && groqKey.length > 10) {
    return "groq";
  }
  return "openai";
}

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const provider = detectProvider();

    if (provider === "groq") {
      // Groq is OpenAI-compatible — just a different base URL, same SDK
      _client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY!,
        baseURL: "https://api.groq.com/openai/v1",
        maxRetries: 2,
        timeout: 120_000,
      });
    } else {
      _client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? "sk-placeholder",
        maxRetries: 2,
        timeout: 120_000,
      });
    }
  }
  return _client;
}

// Returns the correct model name for whichever provider is active
export function getAIModel(): string {
  const provider = detectProvider();
  if (provider === "groq") {
    // llama-3.3-70b-versatile: free, 30 RPM, 500K TPD — great for itinerary generation
    return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  }
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

// Groq is free so we use generous token limits; OpenAI free tier is stingy
// llama-3.3-70b supports up to 32K output tokens on Groq
export function getMaxTokens(): number {
  const provider = detectProvider();
  if (provider === "groq") return 6000; // enough for a 10-day detailed itinerary
  return parseInt(process.env.OPENAI_MAX_TOKENS ?? "4096", 10);
}

export function getProvider(): Provider {
  return detectProvider();
}

// Lazy proxy — keeps `import { openai }` across the codebase working unchanged
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return getOpenAI()[prop as keyof OpenAI];
  },
});

// Legacy exports kept for compatibility
export const AI_MAX_TOKENS = 6000;
export const AI_MODEL = "dynamic"; // use getAIModel() instead
