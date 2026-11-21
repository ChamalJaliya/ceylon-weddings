import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge must know our token names, otherwise it reads `text-label`
 * as a text *colour* and drops it when `text-muted-foreground` follows.
 * Keep in sync with the @theme block in styles/theme.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "compact", "caption", "label"],
      tracking: ["label", "spaced", "eyebrow", "ornate"],
      shadow: ["card", "raised", "overlay", "floating", "dock", "focus", "invalid", "field", "inset-highlight"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
