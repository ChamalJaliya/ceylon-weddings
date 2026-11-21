/**
 * Brand colours for surfaces that cannot read CSS variables — HTML email.
 * Mirrors the primitives in packages/ui/src/styles/tokens.css (pearl/night).
 * The web app must use tokens, never these.
 */
export const BRAND_NAME = "Ceylon Weddings";
export const BRAND_TAGLINE = "Plan a Sri Lankan wedding in one place.";

export const BRAND_COLORS = {
  gold: "#9a6a1e",
  goldDark: "#80571a",
  goldLight: "#d9b56e",
  goldWash: "#f5ead3",
  ink: "#2b1f16",
  inkDeep: "#1f1812",
  body: "#4f4135",
  muted: "#75655a",
  paper: "#fffefb",
  ivory: "#fdfaf4",
  champagne: "#f3e9d2",
  border: "#e8ddcb",
  success: "#3b7449",
  warning: "#d4861a",
  danger: "#b3362b",
  info: "#1e625e",
  white: "#ffffff",
} as const;
