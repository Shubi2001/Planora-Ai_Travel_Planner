"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { useTripStore } from "@/stores/trip-store";
import { DayColumn } from "./day-column";
import { ActivityCard } from "./activity-card";
import type { Activity, TripDay } from "@prisma/client";

type TripWithDays = {
  id: string;
  days: (TripDay & { activities: Activity[] })[];
  currency: string;
};

interface ItineraryBuilderProps {
  trip: TripWithDays;
  userId: string;
}

export function ItineraryBuilder({ trip, userId }: ItineraryBuilderProps) {
  const { reorderActivities } = useTripStore();
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = useCallback(
    (id: string) => {
      const days = useTripStore.getState().currentTrip?.days ?? [];
      // Check if it's a day id
      if (days.find((d) => d.id === id)) return id;
      // Check activities
      for (const day of days) {
        if (day.activities.find((a) => a.id === id)) return day.id;
      }
      return null;
    },
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const days = useTripStore.getState().currentTrip?.days ?? [];
    for (const day of days) {
      const activity = day.activities.find((a) => a.id === active.id);
      if (activity) {
        setActiveActivity(activity);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveActivity(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const days = useTripStore.getState().currentTrip?.days ?? [];

    const sourceDay = days.find((d) =>
      d.activities.some((a) => a.id === active.id)
    );
    const destDayId = findContainer(over.id as string);
    const destDay = days.find((d) => d.id === destDayId);

    if (!sourceDay || !destDay) return;

    const sourceIndex = sourceDay.activities.findIndex((a) => a.id === active.id);
    const destIndex = destDay.activities.findIndex((a) => a.id === over.id);

    reorderActivities(
      sourceDay.id,
      destDay.id,
      sourceIndex,
      destIndex === -1 ? destDay.activities.length : destIndex
    );

    // Persist to server
    try {
      const updatedDays = useTripStore.getState().currentTrip?.days ?? [];
      const allActivities = updatedDays.flatMap((d) =>
        d.activities.map((a, i) => ({ id: a.id, dayId: d.id, sortOrder: i }))
      );

      await fetch(`/api/trips/${trip.id}/activities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activities: allActivities }),
      });
    } catch {
      toast.error("Failed to save reorder. Please try again.");
    }
  };

  const currentTrip = useTripStore((s) => s.currentTrip);
  const days = currentTrip?.days ?? [];

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <div className="text-5xl mb-4">🗓️</div>
        <h3 className="font-semibold mb-2">No itinerary yet</h3>
        <p className="text-sm text-muted-foreground">
          Click &ldquo;Generate AI&rdquo; to create your day-by-day plan.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 space-y-4">
        {days.map((day) => (
          <SortableContext
            key={day.id}
            items={day.activities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <DayColumn
              day={day}
              tripId={trip.id}
              currency={currentTrip?.currency ?? "USD"}
              isOver={overId === day.id}
            />
          </SortableContext>
        ))}
      </div>

      <DragOverlay>
        {activeActivity ? (
          <ActivityCard
            activity={activeActivity}
            tripId={trip.id}
            currency={currentTrip?.currency ?? "USD"}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
