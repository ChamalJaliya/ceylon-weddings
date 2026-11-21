import { readCssTokens } from "@ceylonweddings/ui/tokens";

/**
 * Colours a couple paints onto their board. They are saved into the board
 * document, so they are content (hex), not UI chrome.
 * design-system: user-data-colors
 */
export const MOODBOARD_INK = "#1f1a16";
export const MOODBOARD_DEFAULT_FILL = "#f5e6c8";
export const MOODBOARD_SWATCHES = ["#f5e6c8", "#f8d9d0", "#d9e8df", "#dde4f0", "#efe6f5", "#fffaf5"] as const;
export const MOODBOARD_FILL_SWATCHES = [...MOODBOARD_SWATCHES, MOODBOARD_INK] as const;

type StudioCanvasColors = { accent: string; ink: string; inkSoft: string; paper: string };

let cached: StudioCanvasColors | null = null;

/**
 * Selection / transformer chrome drawn on the Konva canvas. Read once from
 * the studio tokens in packages/ui/src/styles/tokens.css.
 */
export function studioCanvas(): StudioCanvasColors {
  if (cached) return cached;
  const read = readCssTokens({
    accent: "--color-studio-accent",
    ink: "--color-studio-ink",
    inkSoft: "--color-studio-ink-soft",
    paper: "--color-studio-paper",
  });
  // Server render / test: tokens unavailable — don't cache empty values.
  if (!read.accent) return read;
  cached = read;
  return cached;
}
