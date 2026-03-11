import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Trip, TripDay, Activity, Budget, TripCollaborator, User, WeatherForecast } from "@prisma/client";

export type TripWithDays = Trip & {
  days: (TripDay & { activities: Activity[] })[];
  budget?: Budget | null;
  collaborators?: (TripCollaborator & { user: Pick<User, "id" | "name" | "email" | "image"> })[];
  weatherData?: WeatherForecast[];
};

interface TripState {
  trips: Trip[];
  currentTrip: TripWithDays | null;
  weatherLoading: boolean;
  isGenerating: boolean;
  generatingProgress: string;
  generatingChunks: string;
  isDirty: boolean;
  lastSavedAt: Date | null;
}

interface TripActions {
  setTrips: (trips: Trip[]) => void;
  setCurrentTrip: (trip: TripWithDays | null) => void;
  updateTrip: (updates: Partial<Trip>) => void;
  setWeatherData: (forecasts: WeatherForecast[]) => void;
  setWeatherLoading: (loading: boolean) => void;

  // Optimistic activity reorder
  reorderActivities: (
    sourceDayId: string,
    destinationDayId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => void;

  // Move activity to different day
  moveActivity: (
    activityId: string,
    fromDayId: string,
    toDayId: string,
    newIndex: number
  ) => void;

  // Streaming state
  setGenerating: (isGenerating: boolean, progress?: string) => void;
  appendGeneratingChunk: (chunk: string) => void;
  resetGenerating: () => void;

  // Dirty state for auto-save
  markDirty: () => void;
  markSaved: () => void;
}

export const useTripStore = create<TripState & TripActions>()(
  immer(
    persist(
      (set) => ({
        trips: [],
        currentTrip: null,
        weatherLoading: false,
        isGenerating: false,
        generatingProgress: "",
        generatingChunks: "",
        isDirty: false,
        lastSavedAt: null,

        setTrips: (trips) =>
          set((state) => {
            state.trips = trips;
          }),

        setCurrentTrip: (trip) =>
          set((state) => {
            state.currentTrip = trip;
            state.isDirty = false;
          }),

        updateTrip: (updates) =>
          set((state) => {
            if (state.currentTrip) {
              Object.assign(state.currentTrip, updates);
              state.isDirty = true;
            }
          }),

        setWeatherData: (forecasts) =>
          set((state) => {
            if (state.currentTrip) {
              state.currentTrip.weatherData = forecasts;
            }
            state.weatherLoading = false;
          }),

        setWeatherLoading: (loading) =>
          set((state) => {
            state.weatherLoading = loading;
          }),

        reorderActivities: (sourceDayId, destinationDayId, sourceIndex, destinationIndex) =>
          set((state) => {
            if (!state.currentTrip) return;

            const sourceDay = state.currentTrip.days.find((d) => d.id === sourceDayId);
            const destDay = state.currentTrip.days.find((d) => d.id === destinationDayId);

            if (!sourceDay || !destDay) return;

            const [moved] = sourceDay.activities.splice(sourceIndex, 1);
            if (!moved) return;

            if (sourceDayId === destinationDayId) {
              sourceDay.activities.splice(destinationIndex, 0, moved);
            } else {
              moved.dayId = destinationDayId;
              destDay.activities.splice(destinationIndex, 0, moved);
            }

            // Update sort orders
            sourceDay.activities.forEach((a, i) => {
              a.sortOrder = i;
            });

            if (sourceDayId !== destinationDayId) {
              destDay.activities.forEach((a, i) => {
                a.sortOrder = i;
              });
            }

            state.isDirty = true;
          }),

        moveActivity: (activityId, fromDayId, toDayId, newIndex) =>
          set((state) => {
            if (!state.currentTrip) return;

            const fromDay = state.currentTrip.days.find((d) => d.id === fromDayId);
            const toDay = state.currentTrip.days.find((d) => d.id === toDayId);

            if (!fromDay || !toDay) return;

            const actIdx = fromDay.activities.findIndex((a) => a.id === activityId);
            if (actIdx === -1) return;

            const [activity] = fromDay.activities.splice(actIdx, 1);
            if (!activity) return;

            activity.dayId = toDayId;
            toDay.activities.splice(newIndex, 0, activity);
            state.isDirty = true;
          }),

        setGenerating: (isGenerating, progress = "") =>
          set((state) => {
            state.isGenerating = isGenerating;
            state.generatingProgress = progress;
            if (!isGenerating) state.generatingChunks = "";
          }),

        appendGeneratingChunk: (chunk) =>
          set((state) => {
            state.generatingChunks += chunk;
          }),

        resetGenerating: () =>
          set((state) => {
            state.isGenerating = false;
            state.generatingProgress = "";
            state.generatingChunks = "";
          }),

        markDirty: () =>
          set((state) => {
            state.isDirty = true;
          }),

        markSaved: () =>
          set((state) => {
            state.isDirty = false;
            state.lastSavedAt = new Date();
          }),
      }),
      {
        name: "trip-store",
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          currentTrip: state.currentTrip,
          lastSavedAt: state.lastSavedAt,
        }),
      }
    )
  )
);
