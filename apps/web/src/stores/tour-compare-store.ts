'use client';

import { create } from 'zustand';
import { COMPARE_TOURS_MAX } from '@turta/shared-validators';

export type TourCompareSelection = {
  id: string;
  title: string;
  coverUrl: string | null;
  priceLabel: string;
};

type TourCompareState = {
  selected: TourCompareSelection[];
  isDrawerOpen: boolean;
  toggle: (tour: TourCompareSelection) => void;
  remove: (id: string) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  isSelected: (id: string) => boolean;
  canAddMore: () => boolean;
};

export const useTourCompareStore = create<TourCompareState>((set, get) => ({
  selected: [],
  isDrawerOpen: false,

  toggle: (tour) => {
    const { selected } = get();
    const exists = selected.some((item) => item.id === tour.id);
    if (exists) {
      set({
        selected: selected.filter((item) => item.id !== tour.id),
        isDrawerOpen: selected.length <= 1 ? false : get().isDrawerOpen,
      });
      return;
    }
    if (selected.length >= COMPARE_TOURS_MAX) return;
    set({ selected: [...selected, tour] });
  },

  remove: (id) => {
    const next = get().selected.filter((item) => item.id !== id);
    set({
      selected: next,
      isDrawerOpen: next.length === 0 ? false : get().isDrawerOpen,
    });
  },

  clear: () => set({ selected: [], isDrawerOpen: false }),

  openDrawer: () => {
    if (get().selected.length === 0) return;
    set({ isDrawerOpen: true });
  },

  closeDrawer: () => set({ isDrawerOpen: false }),

  isSelected: (id) => get().selected.some((item) => item.id === id),

  canAddMore: () => get().selected.length < COMPARE_TOURS_MAX,
}));

export { COMPARE_TOURS_MAX };
