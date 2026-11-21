/**
 * Read design tokens at runtime for surfaces that cannot use CSS variables:
 * <canvas> (Konva, canvas-confetti) and native colour inputs.
 *
 * Only read tokens that resolve to a plain colour primitive (e.g.
 * `--color-studio-accent` → `#b4532a`); `color-mix()` values are returned
 * as text and canvas APIs cannot parse them.
 */
export function readCssToken(name: `--${string}`, root?: Element): string {
  if (typeof window === "undefined") return "";
  const el = root ?? document.documentElement;
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function readCssTokens<const T extends Record<string, `--${string}`>>(
  map: T,
  root?: Element,
): { [K in keyof T]: string } {
  const out = {} as { [K in keyof T]: string };
  for (const key of Object.keys(map) as Array<keyof T>) {
    out[key] = readCssToken(map[key], root);
  }
  return out;
}
