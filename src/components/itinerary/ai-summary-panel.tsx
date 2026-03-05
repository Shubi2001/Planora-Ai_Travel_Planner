"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, Loader2, BookOpen, Instagram, Video, FileText, ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

const FORMATS = [
  { key: "blog",      label: "Blog Post",       icon: BookOpen,   desc: "300-400 word travel article" },
  { key: "instagram", label: "Instagram",        icon: Instagram,  desc: "3 caption options + hashtags" },
  { key: "reel",      label: "Reel Script",      icon: Video,      desc: "30-second video script" },
  { key: "summary",   label: "Trip Summary",     icon: FileText,   desc: "Short shareable summary" },
] as const;

type Format = typeof FORMATS[number]["key"];

export default function AiSummaryPanel({ tripId }: { tripId: string }) {
  const [selected, setSelected] = useState<Format>("blog");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setContent("");
    try {
      const res = await fetch(`/api/trips/${tripId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: selected }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to generate"); return; }
      setContent(data.data.content);
    } catch {
      toast.error("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCover = async () => {
    setCoverLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/cover`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
      setCoverUrl(data.data.coverUrl);
      toast.success("Cover image generated!");
    } catch {
      toast.error("Cover image generation failed");
    } finally {
      setCoverLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b space-y-4">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" /> AI Content Generator
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Turn your trip into shareable content</p>
        </div>

        {/* Format selector */}
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setSelected(f.key)}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                selected === f.key
                  ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                  : "border-input hover:border-violet-500/30 hover:bg-accent"
              )}
            >
              <f.icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="gradient"
          className="w-full gap-2"
          onClick={generate}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Generating…" : `Generate ${FORMATS.find((f) => f.key === selected)?.label}`}
        </Button>
      </div>

      {/* Cover Image Generator */}
      <div className="px-4 pb-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">AI Cover Image</p>
          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={generateCover} disabled={coverLoading}>
            {coverLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
            {coverLoading ? "Generating…" : "Generate"}
          </Button>
        </div>
        {coverUrl && (
          <div className="relative rounded-xl overflow-hidden border aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverUrl} alt="AI trip cover" className="w-full h-full object-cover" />
            <a
              href={coverUrl}
              download="trip-cover.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 text-white text-xs px-2.5 py-1.5 hover:bg-black/80 transition-colors"
            >
              <Download className="h-3 w-3" /> Save
            </a>
          </div>
        )}
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-32 gap-3 text-muted-foreground"
            >
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              <p className="text-sm">Writing your {FORMATS.find((f) => f.key === selected)?.label}…</p>
            </motion.div>
          )}
          {!loading && content && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {FORMATS.find((f) => f.key === selected)?.label}
                </p>
                <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs" onClick={copy}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="rounded-xl bg-muted/40 border p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {content}
              </div>
            </motion.div>
          )}
          {!loading && !content && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-32 gap-2 text-center"
            >
              <Sparkles className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Select a format and generate</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
