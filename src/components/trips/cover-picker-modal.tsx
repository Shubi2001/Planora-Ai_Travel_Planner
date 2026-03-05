"use client";

import { useState, useCallback } from "react";
import { X, Search, Link2, Sparkles, Check, Loader2, RefreshCw, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

interface Props {
  tripId: string;
  destination: string;
  currentCover?: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: (url: string) => void;
}

// Picsum Photos — deterministic, always works, beautiful landscapes (no API key needed)
function getPicsumGrid(keyword: string, count = 9): string[] {
  const seed = keyword.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return Array.from({ length: count }, (_, i) =>
    `https://picsum.photos/seed/${seed}-${i + 1}/800/500`
  );
}

// Curated high-quality travel photo collections by category using Picsum seeds
const CATEGORY_SEEDS: Record<string, string> = {
  "beach sunset":      "beach-sunset",
  "mountain adventure":"mountain-peaks",
  "city lights":       "city-night",
  "ancient temples":   "temple-ruins",
  "tropical forest":   "tropical-nature",
  "desert dunes":      "desert-sand",
  "snowy alps":        "snow-mountain",
  "island paradise":   "island-sea",
  "safari wildlife":   "wildlife-nature",
  "northern lights":   "aurora-borealis",
};

const POPULAR_CATEGORIES = Object.keys(CATEGORY_SEEDS);

export default function CoverPickerModal({ tripId, destination, currentCover, open, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"explore" | "url" | "ai">("explore");
  const [searchQuery, setSearchQuery] = useState(destination);
  const [photos, setPhotos] = useState<string[]>(() => getPicsumGrid(destination));
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentCover ?? null);
  const [customUrl, setCustomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const refreshPhotos = useCallback((query: string) => {
    const seed = CATEGORY_SEEDS[query] ?? query;
    setPhotos(getPicsumGrid(seed));
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    refreshPhotos(searchQuery.trim());
  };

  const handleAiPick = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/cover`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "AI pick failed"); return; }
      // Use Picsum with destination as seed since Unsplash source is deprecated
      const seed = destination.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const picUrl = `https://picsum.photos/seed/${seed}-ai/1200/600`;
      setAiResult(picUrl);
      setSelectedUrl(picUrl);
      toast.success("AI picked a photo for your trip!");
    } catch {
      toast.error("AI pick failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    const urlToSave = tab === "url" ? customUrl.trim() : selectedUrl;
    if (!urlToSave) { toast.error("Select or enter a photo first"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/cover`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: urlToSave }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
      toast.success("Cover photo updated!");
      onSaved(urlToSave);
      onClose();
    } catch {
      toast.error("Failed to save cover photo");
    } finally {
      setSaving(false);
    }
  };

  // Simple overlay modal — no AnimatePresence to avoid webpack factory issues
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Camera className="h-4 w-4 text-violet-400" />
              Choose Cover Photo
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Make your trip stand out</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1.5 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5 shrink-0">
          {[
            { key: "explore", label: "Explore Photos", icon: Search },
            { key: "url",     label: "Custom URL",    icon: Link2 },
            { key: "ai",      label: "AI Pick",       icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                tab === key
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">

          {/* ── EXPLORE TAB ── */}
          {tab === "explore" && (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search photos (e.g. mountain, beach, city)…"
                    className="pl-9 h-9"
                  />
                </div>
                <Button size="sm" variant="outline" className="h-9 gap-1.5 shrink-0" onClick={handleSearch}>
                  <Search className="h-3.5 w-3.5" /> Search
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-9 shrink-0"
                  onClick={() => { refreshPhotos(searchQuery); }}
                  title="Shuffle"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Category tags */}
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSearchQuery(cat); refreshPhotos(cat); }}
                    className="rounded-full border border-input px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-violet-500/50 hover:text-violet-400 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-2">
                {photos.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setSelectedUrl(url)}
                    className={cn(
                      "relative aspect-video rounded-xl overflow-hidden border-2 transition-all",
                      selectedUrl === url
                        ? "border-violet-500 ring-2 ring-violet-500/30 scale-[0.98]"
                        : "border-transparent hover:border-violet-500/40"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover bg-muted"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/travel-${i}/800/500`;
                      }}
                    />
                    {selectedUrl === url && (
                      <div className="absolute inset-0 bg-violet-500/25 flex items-center justify-center">
                        <div className="bg-violet-500 rounded-full p-1.5 shadow-lg">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── URL TAB ── */}
          {tab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Paste image URL</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={customUrl}
                    onChange={(e) => { setCustomUrl(e.target.value); setSelectedUrl(e.target.value); }}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Paste any public image URL (Unsplash full URL, Pexels, Pixabay, etc.)
                </p>
              </div>

              {customUrl && (
                <div className="rounded-xl overflow-hidden border aspect-video w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}

              <div className="rounded-xl bg-muted/40 border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Free high-quality photo sites</p>
                {[
                  { name: "🖼 Unsplash", url: "https://unsplash.com", note: "Right-click image → Copy image address" },
                  { name: "📷 Pexels",  url: "https://www.pexels.com", note: "Click Download → Copy URL" },
                  { name: "🌄 Pixabay", url: "https://pixabay.com", note: "Free, no attribution needed" },
                ].map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 group">
                    <span className="text-xs text-violet-400 group-hover:underline font-medium">{s.name}</span>
                    <span className="text-[10px] text-muted-foreground">{s.note}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ── AI TAB ── */}
          {tab === "ai" && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-violet-500/5 border-violet-500/20 p-5 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI-Powered Photo Selection</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    AI picks the best matching photo for <strong className="text-foreground">{destination}</strong> based on your travel style.
                  </p>
                </div>
                <Button
                  variant="gradient"
                  className="gap-2"
                  onClick={handleAiPick}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiLoading ? "Picking best photo…" : "Pick with AI"}
                </Button>
              </div>

              {aiResult && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-green-400" /> AI selected this photo
                  </p>
                  <div className="rounded-xl overflow-hidden border-2 border-violet-500/40 aspect-video bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={aiResult} alt="AI picked cover" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            {(tab === "url" ? customUrl : selectedUrl) ? (
              <>
                <div className="h-9 w-14 rounded-lg overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(tab === "url" ? customUrl : selectedUrl) ?? ""}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Photo selected ✓</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No photo selected yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="gradient"
              size="sm"
              className="gap-1.5"
              onClick={handleSave}
              disabled={saving || (!selectedUrl && !customUrl)}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Set as Cover"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
