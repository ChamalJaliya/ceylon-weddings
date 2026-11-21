"use client";

import { useCallback } from "react";
import { useReducedMotion } from "motion/react";
import { readCssTokens } from "../lib/css-tokens";

// ─── Wedding colour palettes ─────────────────────────────────────────────────

// canvas-confetti draws on <canvas>, so read the brand primitives at fire time.

/** Champagne gold · blush · ivory · gold leaf · sand */
const weddingPalette = () =>
  Object.values(
    readCssTokens({
      a: "--cw-gold-300",
      b: "--cw-lotus-100",
      c: "--cw-ivory-100",
      d: "--cw-gold-400",
      e: "--cw-sand-strong",
    }),
  ).filter(Boolean);

/** Lotus pinks for heart / shortlist bursts */
const heartPalette = () =>
  Object.values(
    readCssTokens({
      a: "--cw-lotus-500",
      b: "--cw-lotus-300",
      c: "--cw-lotus-100",
      d: "--cw-maroon-500",
      e: "--cw-gold-300",
    }),
  ).filter(Boolean);

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns wedding-themed confetti helpers.
 * All functions are no-ops when `prefers-reduced-motion` is active.
 * `canvas-confetti` is lazy-imported so it's excluded from the initial bundle.
 */
export function useConfetti() {
  const reduce = useReducedMotion();

  /** Small localised burst from a button / element origin (heart, save, etc.). */
  const heartBurst = useCallback(
    async (origin?: { x: number; y: number }) => {
      if (reduce) return;
      const { default: confetti } = await import("canvas-confetti");
      void confetti({
        particleCount: 30,
        spread: 55,
        origin: origin ?? { x: 0.5, y: 0.5 },
        colors: heartPalette(),
        gravity: 1.6,
        scalar: 0.65,
        ticks: 100,
        startVelocity: 18,
        disableForReducedMotion: true,
      });
    },
    [reduce],
  );

  /** Medium centred burst — for saves, completions, milestones. */
  const burst = useCallback(
    async (origin?: { x: number; y: number }) => {
      if (reduce) return;
      const { default: confetti } = await import("canvas-confetti");
      void confetti({
        particleCount: 80,
        spread: 70,
        origin: origin ?? { x: 0.5, y: 0.65 },
        colors: weddingPalette(),
        gravity: 1.2,
        scalar: 0.9,
        ticks: 220,
        startVelocity: 28,
        disableForReducedMotion: true,
      });
    },
    [reduce],
  );

  /**
   * Full-screen 3-burst shower — RSVP confirmed, Save the Date, etc.
   * Fires left corner → right corner → centre with 150ms offsets.
   */
  const saveDateBurst = useCallback(async () => {
    if (reduce) return;
    const { default: confetti } = await import("canvas-confetti");

    const fire = (opts: Parameters<typeof confetti>[0]) =>
      confetti({ colors: weddingPalette(), disableForReducedMotion: true, ...opts });

    await fire({ particleCount: 60, angle: 60, spread: 58, origin: { x: 0, y: 1 } });
    await new Promise<void>((r) => setTimeout(r, 160));
    await fire({ particleCount: 60, angle: 120, spread: 58, origin: { x: 1, y: 1 } });
    await new Promise<void>((r) => setTimeout(r, 160));
    await fire({ particleCount: 110, spread: 90, origin: { x: 0.5, y: 0.7 }, scalar: 1 });
  }, [reduce]);

  return { burst, heartBurst, saveDateBurst };
}
