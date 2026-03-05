"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Clock, DollarSign, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImage: string;
  durationDays: number;
  estimatedBudget: number;
  currency: string;
  tags: string[];
  travelStyle: string;
  interests: string[];
}

interface Props {
  onSelect: (template: Template) => void;
  selectedId?: string;
}

const CATEGORY_FILTERS = ["All", "honeymoon", "solo", "luxury", "family", "roadtrip", "adventure", "cultural", "wellness"];

export default function TemplateSelector({ onSelect, selectedId }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.data?.templates ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "All" ? templates : templates.filter((t) => t.category === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-violet-400" />
        <h3 className="font-semibold">Start from a Template</h3>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border transition-colors capitalize",
              filter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((tmpl, i) => (
          <motion.button
            key={tmpl.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(tmpl)}
            className={cn(
              "relative rounded-xl overflow-hidden border text-left transition-all hover:scale-[1.02] hover:shadow-lg",
              selectedId === tmpl.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            )}
          >
            {/* Cover image */}
            <div className="relative h-28 overflow-hidden">
              <img
                src={tmpl.coverImage}
                alt={tmpl.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-white font-semibold text-sm leading-tight">{tmpl.name}</p>
              </div>
              {selectedId === tmpl.id && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-2">{tmpl.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {tmpl.durationDays}d
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> ~{tmpl.estimatedBudget.toLocaleString()} {tmpl.currency}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {tmpl.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                    <Tag className="h-2.5 w-2.5 mr-0.5" />{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
