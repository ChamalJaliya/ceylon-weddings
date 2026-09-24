"use client";

import type { Locale, Currency, ThemeName } from "@ceylonweddings/contracts";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferenceState = {
  locale: Locale;
  currency: Currency;
  theme: ThemeName;
  sidebarCollapsed: boolean;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: ThemeName) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
};

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      locale: "en",
      currency: "LKR",
      theme: "pearl",
      sidebarCollapsed: false,
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "cw-preferences",
      partialize: (state) => ({
        locale: state.locale,
        currency: state.currency,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
