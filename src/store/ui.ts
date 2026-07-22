import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ViewMode } from "@/lib/constants";

export interface Filters {
  q: string;
  status: string[];
  priority: string[];
  categoryId?: string;
  collectionId?: string;
  roomId?: string;
  tag?: string;
  favorite?: boolean;
  minPrice?: string;
  maxPrice?: string;
  sort: string;
  order: "asc" | "desc";
}

export const emptyFilters: Filters = {
  q: "",
  status: [],
  priority: [],
  sort: "createdAt",
  order: "desc",
};

interface UiState {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      view: "gallery",
      setView: (view) => set({ view }),
      filters: emptyFilters,
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: emptyFilters }),
      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      quickAddOpen: false,
      setQuickAddOpen: (quickAddOpen) => set({ quickAddOpen }),
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: "lw-ui", partialize: (s) => ({ view: s.view }) }
  )
);
