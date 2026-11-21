"use client";

import { DEFAULT_PALETTE, paletteSchema, type Palette, type ThemeMode } from "@ceylonweddings/contracts";
import { create } from "zustand";
import { PALETTE_STORAGE_KEY } from "./constants";

export { APPEARANCE_BOOT_SCRIPT, PALETTE_STORAGE_KEY, THEME_CLASS, THEME_STORAGE_KEY } from "./constants";

/**
 * Appearance = mode × palette (Kloqra pattern).
 * - Mode (light / dark / system) is owned by next-themes → <html class="pearl|night">.
 * - Palette is owned here → <html data-palette="…"> (absent for the Ceylon default).
 * Both persist on this device and, when signed in, on the account (User.preferences).
 */
export function applyDocumentPalette(palette: Palette) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (palette === DEFAULT_PALETTE) root.removeAttribute("data-palette");
  else root.setAttribute("data-palette", palette);
}

function readStoredPalette(): Palette {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  try {
    const parsed = paletteSchema.safeParse(localStorage.getItem(PALETTE_STORAGE_KEY));
    return parsed.success ? parsed.data : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

type PaletteState = { palette: Palette; setPalette: (palette: Palette) => void };

export const usePaletteStore = create<PaletteState>((set) => ({
  palette: readStoredPalette(),
  setPalette: (palette) => {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch {
      /* storage blocked */
    }
    applyDocumentPalette(palette);
    set({ palette });
  },
}));

export type { Palette, ThemeMode };
