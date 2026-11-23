import type { Palette } from "@ceylonweddings/contracts";
import { palettePatch } from "./palettes";
import { night, pearl, type Theme } from "./tokens";

/** Resolve the active Theme from mode (already resolved to dark/light) × palette. */
export function resolveTheme(dark: boolean, palette: Palette): Theme {
  const base = dark ? night : pearl;
  const patch = palettePatch(palette, dark);
  if (!patch) return base;
  return { ...base, ...patch, overlay: base.overlay, rail: base.rail };
}
