"use client";

import { AlertTriangle, X, ExternalLink } from "lucide-react";
import { useState } from "react";

export default function ApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
      <span className="text-amber-200 flex-1">
        <strong className="text-amber-100">OpenAI key not configured.</strong>{" "}
        AI features (Generate Itinerary, AI Chat, Packing List) require a real key in{" "}
        <code className="bg-amber-900/40 px-1 rounded text-xs">.env.local</code> →{" "}
        <code className="bg-amber-900/40 px-1 rounded text-xs">OPENAI_API_KEY=sk-...</code>
      </span>
      <a
        href="https://platform.openai.com/api-keys"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-amber-300 hover:text-amber-100 transition-colors underline underline-offset-2 shrink-0 text-xs"
      >
        Get key <ExternalLink className="h-3 w-3" />
      </a>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400/60 hover:text-amber-300 transition-colors shrink-0 ml-1"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
