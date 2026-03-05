"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Trash2, Loader2, Package,
  CheckCircle2, Circle, ChevronDown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

interface PackingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  isPacked: boolean;
  isEssential: boolean;
}

interface Props { tripId: string }

const CATEGORY_ICONS: Record<string, string> = {
  Documents: "📄", Clothing: "👕", Toiletries: "🧴",
  Electronics: "💻", Health: "💊", Activities: "🎒",
  Miscellaneous: "📦", General: "📦",
};

export default function PackingChecklist({ tripId }: Props) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/packing`);
    const data = await res.json();
    setItems(data.data?.items ?? []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { load(); }, [load]);

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/packing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ai_generate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data.data.items);
      toast.success(`Generated ${data.data.generated} packing items`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const togglePacked = async (item: PackingItem) => {
    const updated = { ...item, isPacked: !item.isPacked };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    await fetch(`/api/trips/${tripId}/packing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, isPacked: updated.isPacked }),
    });
  };

  const addItem = async () => {
    if (!newItem.trim()) return;
    const res = await fetch(`/api/trips/${tripId}/packing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newItem.trim(), category: "General" }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => [...prev, data.data.item]);
      setNewItem("");
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/trips/${tripId}/packing?itemId=${id}`, { method: "DELETE" });
  };

  const toggleCategory = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // Group by category
  const grouped = items.reduce<Record<string, PackingItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] ?? []).push(item);
    return acc;
  }, {});

  const packedCount = items.filter((i) => i.isPacked).length;
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header + progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Packing List</h3>
          {items.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {packedCount}/{items.length}
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={generateWithAI}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 text-violet-400" />
          )}
          AI Generate
        </Button>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{progress}% packed</p>
        </div>
      )}

      {/* Add item */}
      <div className="flex gap-2">
        <Input
          placeholder="Add item…"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          className="h-8 text-sm"
        />
        <Button size="sm" className="h-8 px-3" onClick={addItem} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No items yet.</p>
          <p className="text-xs mt-1">Click "AI Generate" to build a smart packing list.</p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, catItems]) => {
          const isCollapsed = collapsed.has(category);
          const packedInCat = catItems.filter((i) => i.isPacked).length;
          return (
            <div key={category} className="rounded-xl border overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{CATEGORY_ICONS[category] ?? "📦"}</span>
                  {category}
                  <span className="text-xs text-muted-foreground font-normal">
                    {packedInCat}/{catItems.length}
                  </span>
                </div>
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y">
                      {catItems.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          className="flex items-center gap-3 px-3 py-2 group hover:bg-muted/20"
                        >
                          <button onClick={() => togglePacked(item)} className="flex-shrink-0">
                            {item.isPacked ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <span
                            className={cn(
                              "flex-1 text-sm",
                              item.isPacked && "line-through text-muted-foreground"
                            )}
                          >
                            {item.name}
                            {item.quantity > 1 && (
                              <span className="text-xs text-muted-foreground ml-1">×{item.quantity}</span>
                            )}
                          </span>
                          {item.isEssential && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1">must</Badge>
                          )}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
