/**
 * Optional palette primitives + light/dark semantic overrides.
 * Mirrors packages/ui/src/styles/palettes.css — keep in sync when that file changes.
 * "ceylon" is the brand default (handled in tokens.ts); it is not listed here.
 */

import type { Palette } from "@ceylonweddings/contracts";
import type { Theme } from "./tokens";

type PalettePrims = {
  accent: string;
  accentHover: string;
  subtle: string;
  heading: string;
  body: string;
  page: string;
  card: string;
  border: string;
  darkAccent: string;
  darkHeading: string;
  darkBody: string;
  darkPage: string;
  darkCard: string;
  darkFg?: string;
};

const P: Record<Exclude<Palette, "ceylon">, PalettePrims> = {
  temple: {
    accent: "#7d2232",
    accentHover: "#651a28",
    subtle: "#f6e4e6",
    heading: "#2e1a12",
    body: "#553c2e",
    page: "#f5e9d6",
    card: "#fbf4e8",
    border: "#dec8a6",
    darkAccent: "#e89aaa",
    darkHeading: "#f6ebe0",
    darkBody: "#c9b3a3",
    darkPage: "#1a100c",
    darkCard: "#251812",
  },
  modern: {
    accent: "#0284c7",
    accentHover: "#0369a1",
    subtle: "#e0f2fe",
    heading: "#0f172a",
    body: "#475569",
    page: "#f1f5f9",
    card: "#ffffff",
    border: "#dbe3ee",
    darkAccent: "#38bdf8",
    darkHeading: "#f8fafc",
    darkBody: "#94a3b8",
    darkPage: "#0b1220",
    darkCard: "#141c2b",
  },
  aurora: {
    accent: "#0d9488",
    accentHover: "#0f766e",
    subtle: "#ccfbf1",
    heading: "#134e4a",
    body: "#3f5f5b",
    page: "#f0fdfa",
    card: "#ffffff",
    border: "#cce8e2",
    darkAccent: "#2dd4bf",
    darkHeading: "#f0fdfa",
    darkBody: "#99f6e4",
    darkPage: "#042f2e",
    darkCard: "#0f3d3a",
  },
  noir: {
    accent: "#111827",
    accentHover: "#030712",
    subtle: "#f3f4f6",
    heading: "#111827",
    body: "#4b5563",
    page: "#f9fafb",
    card: "#ffffff",
    border: "#e5e7eb",
    darkAccent: "#e5e7eb",
    darkHeading: "#f9fafb",
    darkBody: "#9ca3af",
    darkPage: "#030712",
    darkCard: "#111827",
    darkFg: "#030712",
  },
  sunset: {
    accent: "#ea580c",
    accentHover: "#c2410c",
    subtle: "#ffedd5",
    heading: "#1c1917",
    body: "#57534e",
    page: "#fafaf9",
    card: "#ffffff",
    border: "#e7e5e4",
    darkAccent: "#fb923c",
    darkHeading: "#fafaf9",
    darkBody: "#a8a29e",
    darkPage: "#1c1917",
    darkCard: "#292524",
  },
  "forest-walnut": {
    accent: "#234e32",
    accentHover: "#1b3d27",
    subtle: "#e9f0eb",
    heading: "#18261e",
    body: "#4b5a51",
    page: "#f7f6f2",
    card: "#ffffff",
    border: "#dedbd2",
    darkAccent: "#4ade80",
    darkHeading: "#f2f7f4",
    darkBody: "#a1b3a6",
    darkPage: "#0d1711",
    darkCard: "#15241b",
  },
  "bordeaux-taupe": {
    accent: "#722230",
    accentHover: "#5c1b26",
    subtle: "#f9edf0",
    heading: "#281518",
    body: "#665558",
    page: "#fbf9f6",
    card: "#ffffff",
    border: "#e8e0d7",
    darkAccent: "#fb7185",
    darkHeading: "#faf3f4",
    darkBody: "#bda8ab",
    darkPage: "#190e12",
    darkCard: "#26161c",
  },
  "midnight-ivory": {
    accent: "#172b4d",
    accentHover: "#12213a",
    subtle: "#e9eef6",
    heading: "#0f1b2d",
    body: "#4a5768",
    page: "#faf8f2",
    card: "#ffffff",
    border: "#e3dfd3",
    darkAccent: "#60a5fa",
    darkHeading: "#f8fafc",
    darkBody: "#9aaec4",
    darkPage: "#0a121e",
    darkCard: "#121e30",
  },
  "olive-linen": {
    accent: "#4d5e2a",
    accentHover: "#3f4e22",
    subtle: "#eff3e8",
    heading: "#22271c",
    body: "#5c6253",
    page: "#f5f3eb",
    card: "#ffffff",
    border: "#ded8c8",
    darkAccent: "#a3e635",
    darkHeading: "#f7f9f2",
    darkBody: "#a9b29e",
    darkPage: "#13170e",
    darkCard: "#1d2316",
  },
  "sage-ivory": {
    accent: "#7a8f71",
    accentHover: "#667860",
    subtle: "#e9eee4",
    heading: "#2f352c",
    body: "#5c6358",
    page: "#f7f4ee",
    card: "#fffefa",
    border: "#d8ddd0",
    darkAccent: "#a8b89e",
    darkHeading: "#f4f6f1",
    darkBody: "#a3afa0",
    darkPage: "#171c16",
    darkCard: "#222821",
  },
  "champagne-gold": {
    accent: "#c4a35a",
    accentHover: "#a88b45",
    subtle: "#f5eedf",
    heading: "#3d3420",
    body: "#6b5e45",
    page: "#fbf7f0",
    card: "#fffefb",
    border: "#e6dfcb",
    darkAccent: "#d4b86a",
    darkHeading: "#fbf6ec",
    darkBody: "#c2b18a",
    darkPage: "#1a160e",
    darkCard: "#2a2416",
  },
  "dusty-blue-ivory": {
    accent: "#7a8fa3",
    accentHover: "#647a8f",
    subtle: "#e8eef2",
    heading: "#2a3540",
    body: "#5a6570",
    page: "#f7f5f1",
    card: "#fffefc",
    border: "#d4dbe2",
    darkAccent: "#9bb0c2",
    darkHeading: "#f4f7fa",
    darkBody: "#a3b2c0",
    darkPage: "#121820",
    darkCard: "#1c2530",
  },
  "blush-cream": {
    accent: "#c49191",
    accentHover: "#b07878",
    subtle: "#f7eded",
    heading: "#3d2e2e",
    body: "#6b5858",
    page: "#fbf6f4",
    card: "#fffefd",
    border: "#e6d8d8",
    darkAccent: "#e0a8a8",
    darkHeading: "#faf3f3",
    darkBody: "#c9a8a8",
    darkPage: "#1a1212",
    darkCard: "#2a1c1c",
  },
  "emerald-gold": {
    accent: "#1b4d3e",
    accentHover: "#153d32",
    subtle: "#e6efea",
    heading: "#142820",
    body: "#4a5c54",
    page: "#f6f3ec",
    card: "#fffefb",
    border: "#d2dbd4",
    darkAccent: "#c9a84c",
    darkHeading: "#f6f3ec",
    darkBody: "#b8c4b4",
    darkPage: "#0c1814",
    darkCard: "#15241e",
  },
  "terracotta-sand": {
    accent: "#c45c3a",
    accentHover: "#a84c30",
    subtle: "#f5e8e0",
    heading: "#3a241c",
    body: "#6b4e42",
    page: "#faf5f0",
    card: "#fffefc",
    border: "#e4d4c6",
    darkAccent: "#e07a5a",
    darkHeading: "#faf3ee",
    darkBody: "#c4a898",
    darkPage: "#1a120e",
    darkCard: "#2a1c16",
  },
  "lavender-taupe": {
    accent: "#9b8aa8",
    accentHover: "#857492",
    subtle: "#efeaf2",
    heading: "#322a38",
    body: "#5e5566",
    page: "#f7f4f2",
    card: "#fffefd",
    border: "#dcd5df",
    darkAccent: "#c4b0d4",
    darkHeading: "#f7f2f8",
    darkBody: "#b8a8c4",
    darkPage: "#161218",
    darkCard: "#221c26",
  },
  "navy-gold": {
    accent: "#1a2b4a",
    accentHover: "#142238",
    subtle: "#e8ecf2",
    heading: "#121c2e",
    body: "#4a5568",
    page: "#faf7f0",
    card: "#fffefb",
    border: "#d8d4c6",
    darkAccent: "#d4b86a",
    darkHeading: "#f8f6f0",
    darkBody: "#a8b4c4",
    darkPage: "#0a1018",
    darkCard: "#121c2a",
  },
  "mocha-ivory": {
    accent: "#6b4e3d",
    accentHover: "#5a4133",
    subtle: "#f0e8e0",
    heading: "#2e241c",
    body: "#5c4e42",
    page: "#f8f4ee",
    card: "#fffefb",
    border: "#dcd4c8",
    darkAccent: "#c4a484",
    darkHeading: "#f6f1ea",
    darkBody: "#b8a898",
    darkPage: "#14100c",
    darkCard: "#221c16",
  },
  "black-white": {
    accent: "#111111",
    accentHover: "#000000",
    subtle: "#f0f0f0",
    heading: "#111111",
    body: "#4a4a4a",
    page: "#fafafa",
    card: "#ffffff",
    border: "#e0e0e0",
    darkAccent: "#e8e8e8",
    darkHeading: "#f7f7f7",
    darkBody: "#a0a0a0",
    darkPage: "#0a0a0a",
    darkCard: "#161616",
    darkFg: "#0a0a0a",
  },
  "peach-coral": {
    accent: "#e07a5f",
    accentHover: "#c9654a",
    subtle: "#fcede8",
    heading: "#3a241c",
    body: "#6b5248",
    page: "#fbf7f3",
    card: "#fffefc",
    border: "#e6d6ce",
    darkAccent: "#f0a08a",
    darkHeading: "#faf3ef",
    darkBody: "#c8a898",
    darkPage: "#1a1210",
    darkCard: "#2a1c18",
  },
  "greenery-white": {
    accent: "#4f7a3e",
    accentHover: "#426834",
    subtle: "#eaf0e6",
    heading: "#24301e",
    body: "#55634a",
    page: "#f7f9f5",
    card: "#ffffff",
    border: "#d2dbc8",
    darkAccent: "#8fbf7a",
    darkHeading: "#f4f8f1",
    darkBody: "#a8bca0",
    darkPage: "#10180e",
    darkCard: "#1a2416",
  },
};

type SemanticPatch = Partial<
  Pick<
    Theme,
    | "page"
    | "card"
    | "inset"
    | "accentBg"
    | "border"
    | "borderStrong"
    | "heading"
    | "body"
    | "muted"
    | "primary"
    | "primaryFg"
    | "primaryText"
    | "chart"
  >
>;

function lightPatch(p: PalettePrims): SemanticPatch {
  return {
    primary: p.accent,
    primaryFg: "#ffffff",
    primaryText: p.accentHover,
    heading: p.heading,
    body: p.body,
    muted: mixBodyMuted(p.body, p.page),
    page: p.page,
    card: p.card,
    accentBg: p.subtle,
    inset: mixHex(p.page, p.subtle, 70),
    border: p.border,
    borderStrong: mixHex(p.border, p.heading, 70),
    chart: [p.accent, p.accentHover, p.heading, p.body, p.border, p.subtle],
  };
}

function darkPatch(p: PalettePrims): SemanticPatch {
  const fg = p.darkFg ?? p.darkPage;
  return {
    primary: p.darkAccent,
    primaryFg: fg,
    primaryText: p.darkAccent,
    heading: p.darkHeading,
    body: mixHex(p.darkHeading, p.darkBody, 86),
    muted: mixHex(p.darkHeading, p.darkBody, 62),
    page: p.darkPage,
    card: p.darkCard,
    accentBg: withAlpha(p.darkAccent, 0.14),
    inset: mixHex(p.darkPage, p.darkCard, 70),
    border: withAlpha(p.darkHeading, 0.14),
    borderStrong: withAlpha(p.darkHeading, 0.24),
    chart: [p.darkAccent, p.darkHeading, p.darkBody, p.darkCard, p.accent, p.subtle],
  };
}

/** Approximate CSS color-mix(in srgb, a X%, b). */
function mixHex(a: string, b: string, pctA: number): string {
  const pa = pctA / 100;
  const [ra, ga, ba] = hexRgb(a);
  const [rb, gb, bb] = hexRgb(b);
  const r = Math.round(ra * pa + rb * (1 - pa));
  const g = Math.round(ga * pa + gb * (1 - pa));
  const bl = Math.round(ba * pa + bb * (1 - pa));
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function mixBodyMuted(body: string, page: string): string {
  return mixHex(body, page, 88);
}

function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

export function palettePatch(palette: Palette, dark: boolean): SemanticPatch | null {
  if (palette === "ceylon") return null;
  const p = P[palette];
  return dark ? darkPatch(p) : lightPatch(p);
}

/** Swatch colors for the settings picker (always light accent + page). */
export function paletteSwatch(palette: Palette): { accent: string; page: string; card: string } {
  if (palette === "ceylon") return { accent: "#9a6a1e", page: "#fdfaf4", card: "#fffefb" };
  const p = P[palette];
  return { accent: p.accent, page: p.page, card: p.card };
}
