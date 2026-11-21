"use client";

import type { Locale, Currency } from "@ceylonweddings/contracts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferenceState = {
  locale: Locale;
  currency: Currency;
  sidebarCollapsed: boolean;
  /** True once the user toggled the rail; before that, compact laptops auto-collapse it. */
  sidebarCollapsedChosen: boolean;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
};

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      locale: "en",
      currency: "LKR",
      sidebarCollapsed: false,
      sidebarCollapsedChosen: false,
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed, sidebarCollapsedChosen: true }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed, sidebarCollapsedChosen: true })),
    }),
    {
      name: "cw-preferences",
      partialize: (state) => ({
        locale: state.locale,
        currency: state.currency,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarCollapsedChosen: state.sidebarCollapsedChosen,
      }),
    },
  ),
);
