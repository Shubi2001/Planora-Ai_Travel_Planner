"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Which trips do I have?",
  "When does my next trip start and end?",
  "What are the stops in my trip?",
  "Tell me about my Ladakh trip",
  "Best places to visit in Rajasthan?",
  "5-day Kerala itinerary",
];

export function AiChatPanel() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const userMsg: ChatMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.error ?? `Error ${res.status}`;
        if (res.status === 429) {
          toast.error("Rate limit reached. Please wait a moment.");
        } else if (res.status === 401) {
          toast.error("AI service not configured. Check API keys.");
        } else {
          toast.error(errMsg);
        }
        setMessages((prev) => prev.filter((m) => m !== userMsg));
        return;
      }

      const reply = data.data?.message ?? "I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-2xl border bg-card/80 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-violet-500/15 items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-violet-400" />
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Ask about your trips, itineraries, or plan new adventures
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="rounded-full border px-3 py-1.5 text-xs hover:border-violet-500/50 hover:bg-violet-500/10 transition-all disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              m.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-lg shrink-0 flex items-center justify-center",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-violet-500/15 text-violet-400"
              )}
            >
              {m.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "rounded-xl px-4 py-2.5 max-w-[85%] text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center bg-violet-500/15 text-violet-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl px-4 py-2.5 bg-muted">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your trips, dates, stops, flights..."
            className="flex-1 min-h-[44px] max-h-32 rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            rows={1}
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            variant="gradient"
            className="h-11 w-11 shrink-0 rounded-xl"
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
