import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  mapVisible: boolean;
  selectedActivityId: string | null;
  selectedDayId: string | null;
  mapCenter: { lat: number; lng: number } | null;
  mapZoom: number;
  activeFilters: {
    categories: string[];
    timeSlots: string[];
  };
}

interface UiActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMap: () => void;
  setMapVisible: (visible: boolean) => void;
  selectActivity: (id: string | null) => void;
  selectDay: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setFilters: (filters: Partial<UiState["activeFilters"]>) => void;
  resetFilters: () => void;
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  sidebarOpen: true,
  mobileSidebarOpen: false,
  mapVisible: true,
  selectedActivityId: null,
  selectedDayId: null,
  mapCenter: null,
  mapZoom: 12,
  activeFilters: {
    categories: [],
    timeSlots: [],
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMap: () => set((s) => ({ mapVisible: !s.mapVisible })),
  setMapVisible: (visible) => set({ mapVisible: visible }),
  selectActivity: (id) => set({ selectedActivityId: id }),
  selectDay: (id) => set({ selectedDayId: id }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setFilters: (filters) =>
    set((s) => ({ activeFilters: { ...s.activeFilters, ...filters } })),
  resetFilters: () =>
    set({ activeFilters: { categories: [], timeSlots: [] } }),
}));
