"use client";

import { create } from "zustand";

// Глобално състояние на интерфейса (zustand, както в МатураПлюс).

type AppState = {
  /** Спестени минути от екипа за тази сесия — броячът в горната лента */
  savedMinutes: number;
  lastSavedGain: number | null;
  projectorMode: boolean;
  addSavedMinutes: (minutes: number) => void;
  toggleProjectorMode: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  savedMinutes: 0,
  lastSavedGain: null,
  projectorMode: false,
  addSavedMinutes: (minutes) => {
    set({ savedMinutes: get().savedMinutes + minutes, lastSavedGain: minutes });
    setTimeout(() => {
      if (get().lastSavedGain === minutes) set({ lastSavedGain: null });
    }, 5500);
  },
  toggleProjectorMode: () => {
    const next = !get().projectorMode;
    if (typeof document !== "undefined") document.documentElement.classList.toggle("projector-mode", next);
    set({ projectorMode: next });
  },
}));
