import type { WeddingStyle } from "./enums";

/**
 * Default palettes a couple picks during onboarding. These are content saved
 * onto the wedding record (`wedding.colors`), not UI chrome — so they are hex,
 * and exempt from the design-system colour guard.
 * design-system: user-data-colors
 */
export const WEDDING_STYLE_PALETTES: Record<WeddingStyle, readonly string[]> = {
  MINIMALIST: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"],
  TRADITIONAL: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"],
  KANDYAN: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"],
  MODERN: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"],
  BEACH: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"],
};

export const WEDDING_STYLE_LABELS: Record<WeddingStyle, string> = {
  MINIMALIST: "Minimalist",
  TRADITIONAL: "Traditional",
  KANDYAN: "Kandyan",
  MODERN: "Modern",
  BEACH: "Beach",
};

export const WEDDING_STYLE_OPTIONS: ReadonlyArray<{
  value: WeddingStyle;
  label: string;
  swatches: string[];
}> = (Object.keys(WEDDING_STYLE_PALETTES) as WeddingStyle[]).map((value) => ({
  value,
  label: WEDDING_STYLE_LABELS[value],
  swatches: [...WEDDING_STYLE_PALETTES[value]],
}));

/** Mutable copy for saving onto a wedding record. */
export function weddingStyleColors(style: WeddingStyle): string[] {
  return [...WEDDING_STYLE_PALETTES[style]];
}
