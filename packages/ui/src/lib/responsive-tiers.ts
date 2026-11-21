/**
 * Single owner of viewport density tiers.
 *
 * styles/density.css and the `compact:` / `dense:` variants in styles/globals.css
 * must use these exact strings — scripts/check-design-system.mjs fails otherwise.
 * Do not write `max-[1400px]:` or a width/height @media query anywhere else.
 */
export const DENSITY_MEDIA_QUERIES = {
  compact:
    "(max-width: 1400px), (max-width: 1699px) and (max-resolution: 1.99dppx), (max-height: 720px)",
  dense: "(min-width: 640px) and (max-height: 720px)",
  phone: "(max-width: 639px)",
} as const;

export type DensityTier = keyof typeof DENSITY_MEDIA_QUERIES;

/** Chrome DevTools custom devices to reproduce each tier on a Retina Mac. */
export const DENSITY_REFERENCE_VIEWPORTS = [
  { name: "HP 1366×768 @100%", width: 1310, height: 637, dpr: 1, tier: "dense" },
  { name: "Windows laptop @125%", width: 1536, height: 740, dpr: 1.25, tier: "compact" },
  { name: "MacBook Air 13", width: 1470, height: 956, dpr: 2, tier: "comfortable" },
  { name: "iPhone 15", width: 393, height: 852, dpr: 3, tier: "phone" },
] as const;
