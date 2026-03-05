"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin, Clock, DollarSign, ExternalLink } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils/cn";
import ActivityReactions from "./activity-reactions";
import type { Activity } from "@prisma/client";

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  ATTRACTION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  HOTEL: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
  TRANSPORT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
  SHOPPING: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200",
  ENTERTAINMENT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  NATURE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  CULTURE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  SPORT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  OTHER: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200",
};

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍽️",
  ATTRACTION: "🏛️",
  HOTEL: "🏨",
  TRANSPORT: "🚌",
  SHOPPING: "🛍️",
  ENTERTAINMENT: "🎭",
  NATURE: "🌿",
  CULTURE: "🎨",
  SPORT: "⚽",
  OTHER: "📍",
};

interface ActivityCardProps {
  activity: Activity;
  tripId: string;
  currency: string;
  isDragging?: boolean;
}

export function ActivityCard({ activity, tripId, currency, isDragging }: ActivityCardProps) {
  const { selectActivity, selectedActivityId } = useUiStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const isSelected = selectedActivityId === activity.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectActivity(isSelected ? null : activity.id)}
      className={cn(
        "group flex items-start gap-2 rounded-lg border bg-background p-3 cursor-pointer transition-all",
        isSelected && "border-primary shadow-sm",
        isDragging && "shadow-2xl rotate-2 scale-105",
        !isDragging && "hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 touch-none cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm shrink-0">{CATEGORY_EMOJI[activity.category] ?? "📍"}</span>
            <h4 className="text-sm font-medium truncate">{activity.title}</h4>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              CATEGORY_COLORS[activity.category] ?? CATEGORY_COLORS.OTHER
            )}
          >
            {activity.category.toLowerCase()}
          </span>
        </div>

        {activity.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {activity.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {activity.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{activity.location}</span>
            </span>
          )}
          {activity.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {activity.duration < 60
                ? `${activity.duration}m`
                : `${Math.floor(activity.duration / 60)}h${activity.duration % 60 > 0 ? ` ${activity.duration % 60}m` : ""}`}
            </span>
          )}
          {activity.isFree ? (
            <span className="text-emerald-600 font-medium">Free</span>
          ) : activity.estimatedCost != null && activity.estimatedCost > 0 ? (
            <span className="flex items-center gap-0.5 font-medium">
              <DollarSign className="h-3 w-3" />
              {currency} {activity.estimatedCost.toLocaleString()}
            </span>
          ) : null}

          {activity.websiteUrl && (
            <a
              href={activity.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-0.5 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Visit
            </a>
          )}
        </div>

        {/* Tips */}
        {isSelected && activity.notes && (
          <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-3 py-2">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              💡 {activity.notes}
            </p>
          </div>
        )}

        {/* Voting + inline comments */}
        <ActivityReactions activityId={activity.id} activityTitle={activity.title} />
      </div>
    </div>
  );
}
