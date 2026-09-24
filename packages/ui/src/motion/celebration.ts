"use client";

import { useCallback } from "react";
import { useReducedMotion } from "motion/react";

// ─── Wedding colour palettes ─────────────────────────────────────────────────

/** Champagne gold · blush · ivory · rose · sand */
const WEDDING_PALETTE = ["#D4AF6A", "#E8C4B8", "#F5F0E8", "#A0796A", "#C8B8A2"];
/** Soft pinks for heart / shortlist bursts */
const HEART_PALETTE = ["#FF85A2", "#FFB6C1", "#FF69B4", "#E8C4B8", "#FFAEC0"];

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
        colors: HEART_PALETTE,
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
        colors: WEDDING_PALETTE,
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
      confetti({ colors: WEDDING_PALETTE, disableForReducedMotion: true, ...opts });

    await fire({ particleCount: 60, angle: 60, spread: 58, origin: { x: 0, y: 1 } });
    await new Promise<void>((r) => setTimeout(r, 160));
    await fire({ particleCount: 60, angle: 120, spread: 58, origin: { x: 1, y: 1 } });
    await new Promise<void>((r) => setTimeout(r, 160));
    await fire({ particleCount: 110, spread: 90, origin: { x: 0.5, y: 0.7 }, scalar: 1 });
  }, [reduce]);

  return { burst, heartBurst, saveDateBurst };
}
