"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface ChatMsg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  proposedChanges?: string | null;
  appliedAt?: string | null;
  createdAt: string;
}

interface Props {
  tripId: string;
}

const SUGGESTIONS = [
  "Make my trip more budget-friendly",
  "Add more local food experiences",
  "Suggest a day trip option",
  "What should I pack for this trip?",
  "Optimize the daily schedule",
];

export default function TripChatPanel({ tripId }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/chat`);
      const data = await res.json();
      setMessages(data.data?.messages ?? []);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const optimistic: ChatMsg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/trips/${tripId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      // Safely parse — empty/non-JSON bodies won't crash
      let data: { error?: string; data?: { message: ChatMsg } } = {};
      try {
        data = await res.json();
      } catch {
        // response body was empty or not JSON
      }

      if (!res.ok) {
        const errMsg = data.error ?? `Error ${res.status}`;
        if (res.status === 429) {
          toast.error("AI rate limit reached. Please wait a few seconds and try again.", {
            duration: 6000,
          });
        } else if (res.status === 401) {
          toast.error("OpenAI API key is invalid. Check OPENAI_API_KEY in .env.local");
        } else {
          toast.error(errMsg);
        }
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return;
      }

      if (data.data?.message) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== optimistic.id),
          data.data!.message,
        ]);
      }
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const applyChanges = async (msgId: string, changesJson: string) => {
    setApplyingId(msgId);
    try {
      const changes = JSON.parse(changesJson);
      // Mark as applied in DB
      await fetch(`/api/trips/${tripId}/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId }),
      });
      toast.success(`Applied: ${changes.description ?? "Changes applied"}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, appliedAt: new Date().toISOString() } : m))
      );
    } catch {
      toast.error("Failed to apply changes");
    } finally {
      setApplyingId(null);
    }
  };

  const clearHistory = async () => {
    await fetch(`/api/trips/${tripId}/chat`, { method: "DELETE" });
    setMessages([]);
    toast.success("Conversation cleared");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Strip the ```changes block from displayed content
  const displayContent = (content: string) =>
    content.replace(/```changes\n[\s\S]*?\n```/g, "").trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium">AI Travel Assistant</p>
            <p className="text-xs text-muted-foreground">Knows your full itinerary</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearHistory}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Bot className="h-7 w-7 text-violet-400" />
            </div>
            <div>
              <p className="font-medium">Ask me anything about your trip</p>
              <p className="text-sm text-muted-foreground mt-1">
                I can modify the itinerary, suggest activities, and help plan your budget.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.role === "user"
                    ? "bg-primary/20"
                    : "bg-violet-500/20"
                )}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-violet-400" />
                )}
              </div>

              {/* Bubble */}
              <div className={cn("max-w-[80%] space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}
                >
                  {displayContent(msg.content)}
                </div>

                {/* Proposed changes banner */}
                {msg.proposedChanges && (
                  <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
                    <p className="text-xs font-medium text-violet-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Itinerary changes suggested
                    </p>
                    {msg.appliedAt ? (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Applied
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                        disabled={applyingId === msg.id}
                        onClick={() => applyChanges(msg.id, msg.proposedChanges!)}
                      >
                        {applyingId === msg.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Preview &amp; Apply
                      </Button>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground px-1">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {sending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="h-7 w-7 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-violet-400" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card/50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your trip… (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[40px] max-h-32 overflow-y-auto"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl bg-violet-600 hover:bg-violet-700 flex-shrink-0"
            onClick={() => send()}
            disabled={!input.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Shift+Enter for new line · AI has full trip context
        </p>
      </div>
    </div>
  );
}
