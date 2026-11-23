/**
 * Mirrors packages/ui/src/styles/tokens.css — Ceylon (default) pearl / night semantics.
 * Never add a colour here that isn't in tokens.css.
 */

export const cw = {
  white: "#ffffff",
  black: "#0b0806",
  ivory0: "#fffefb",
  ivory50: "#fdfaf4",
  ivory100: "#f8f2e7",
  linen: "#f3ebdd",
  sand: "#e8ddcb",
  sandStrong: "#d9cab2",
  champagne: "#f3e9d2",
  ink900: "#2b1f16",
  ink700: "#4f4135",
  ink500: "#75655a",
  gold100: "#f5ead3",
  gold300: "#d9b56e",
  gold400: "#c39a4d",
  gold600: "#9a6a1e",
  gold700: "#80571a",
  maroon100: "#f6e4e6",
  maroon700: "#7d2232",
  lotus100: "#fbe7eb",
  lotus500: "#c9566b",
  lotus700: "#8e3446",
  jade100: "#e1efec",
  jade500: "#2f827b",
  jade700: "#1e625e",
  saffron100: "#fbebd0",
  saffron500: "#d4861a",
  leaf100: "#e3f0e4",
  leaf600: "#3b7449",
  vermilion100: "#f8e1de",
  vermilion600: "#b3362b",
  night1000: "#0e0a07",
  night950: "#15100c",
  night900: "#1f1812",
  night850: "#251d16",
  night800: "#2a2119",
  night700: "#3a2e24",
  cream100: "#f4ecdf",
  cream300: "#d9ccb9",
  cream500: "#a8998a",
} as const;

export type ThemeOverlays = {
  /** Hero / photo scrim stops (top → mid → bottom). */
  scrimTop: string;
  scrimMid: string;
  scrimBottom: string;
  scrimHeavy: string;
  vignette: string;
  quickAction: string;
  frostLight: string;
  frostDark: string;
  glassFill: string;
  glassBorder: string;
  glassChip: string;
  glassChipStrong: string;
  onImageFg: string;
  onImageMuted: string;
  /** Intentional third-party brand (not palette-driven). */
  whatsapp: string;
};

export type ThemeRail = {
  page: string;
  card: string;
  border: string;
  heading: string;
  body: string;
  muted: string;
  primary: string;
  accentBg: string;
};

export type Theme = {
  dark: boolean;
  page: string;
  card: string;
  inset: string;
  accentBg: string;
  border: string;
  borderStrong: string;
  heading: string;
  body: string;
  muted: string;
  primary: string;
  primaryFg: string;
  primaryText: string;
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;
  love: string;
  loveSubtle: string;
  heroFg: string;
  ink: string;
  chart: string[];
  overlay: ThemeOverlays;
  /** Night-branded rail tokens (web app rail). The mobile side drawer follows the active theme instead. */
  rail: ThemeRail;
};

export const overlays: ThemeOverlays = {
  scrimTop: "rgba(11,8,6,0.45)",
  scrimMid: "rgba(11,8,6,0.05)",
  scrimBottom: "rgba(11,8,6,0.82)",
  scrimHeavy: "rgba(11,8,6,0.78)",
  vignette: "rgba(11,8,6,0.5)",
  quickAction: "rgba(11,8,6,0.35)",
  frostLight: "rgba(253,250,244,0.75)",
  frostDark: "rgba(21,16,12,0.7)",
  glassFill: "rgba(255,254,251,0.18)",
  glassBorder: "rgba(255,254,251,0.3)",
  glassChip: "rgba(255,254,251,0.35)",
  glassChipStrong: "rgba(255,254,251,0.8)",
  onImageFg: "#ffffff",
  onImageMuted: "rgba(255,254,251,0.5)",
  whatsapp: "#25a35a",
};

/** Night ink + gold rail — fixed, independent of active palette. */
export const rail: ThemeRail = {
  page: cw.night950,
  card: cw.night900,
  border: cw.night700,
  heading: cw.cream100,
  body: cw.cream300,
  muted: cw.cream500,
  primary: cw.gold300,
  accentBg: "rgba(217,181,110,0.16)",
};

export const pearl: Theme = {
  dark: false,
  page: cw.ivory50,
  card: cw.ivory0,
  inset: cw.linen,
  accentBg: cw.gold100,
  border: cw.sand,
  borderStrong: cw.sandStrong,
  heading: cw.ink900,
  body: cw.ink700,
  muted: cw.ink500,
  primary: cw.gold600,
  primaryFg: cw.white,
  primaryText: cw.gold700,
  success: cw.leaf600,
  successSubtle: cw.leaf100,
  warning: cw.saffron500,
  warningSubtle: cw.saffron100,
  danger: cw.vermilion600,
  dangerSubtle: cw.vermilion100,
  info: cw.jade700,
  infoSubtle: cw.jade100,
  love: cw.lotus500,
  loveSubtle: cw.lotus100,
  heroFg: cw.ivory0,
  ink: cw.black,
  chart: [cw.gold600, cw.leaf600, cw.jade500, cw.lotus500, cw.saffron500, cw.maroon700],
  overlay: overlays,
  rail,
};

export const night: Theme = {
  dark: true,
  page: cw.night950,
  card: cw.night900,
  inset: cw.night850,
  accentBg: "rgba(217,181,110,0.16)",
  border: cw.night700,
  borderStrong: "#4a3b2e",
  heading: cw.cream100,
  body: cw.cream300,
  muted: cw.cream500,
  primary: cw.gold300,
  primaryFg: cw.night950,
  primaryText: cw.gold300,
  success: "#8cc79a",
  successSubtle: "rgba(140,199,154,0.14)",
  warning: "#f0bf6c",
  warningSubtle: "rgba(240,191,108,0.14)",
  danger: "#ee9a90",
  dangerSubtle: "rgba(238,154,144,0.14)",
  info: "#7fc2b8",
  infoSubtle: "rgba(127,194,184,0.14)",
  love: "#e89aaa",
  loveSubtle: "rgba(232,154,170,0.14)",
  heroFg: cw.ivory0,
  ink: cw.black,
  chart: [cw.gold300, "#8cc79a", "#7fc2b8", "#e89aaa", "#f0bf6c", "#c9566b"],
  overlay: overlays,
  rail,
};

/** Font families registered in app/_layout.tsx (expo-google-fonts). */
export const font = {
  display: "CormorantGaramond_500Medium",
  displayItalic: "CormorantGaramond_500Medium_Italic",
  displayBold: "CormorantGaramond_600SemiBold",
  sans: "Geist_400Regular",
  sansMedium: "Geist_500Medium",
};

export const radius = { xs: 6, sm: 14, md: 16, lg: 20, xl: 24, hero: 28, full: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

/** --tracking-ornate (0.28em) / --tracking-eyebrow (0.2em) at a given font size. */
export const ornate = (size: number) => size * 0.28;
export const eyebrow = (size: number) => size * 0.2;

export const shadow = {
  card: {
    shadowColor: cw.ink900,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: cw.ink900,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
