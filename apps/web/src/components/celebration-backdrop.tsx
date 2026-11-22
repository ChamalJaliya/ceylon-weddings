"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventKind } from "@ceylonweddings/contracts";

export type CelebrationTheme = "champagne" | "petals";

/**
 * Champagne only where it fits: a church service, reception or engagement — and never alongside
 * a Nikah, Walima or Mehndi. Everyone else gets frangipani petals and gold sparkles.
 */
export function celebrationThemeFor(kinds: EventKind[]): CelebrationTheme {
  const dry: EventKind[] = ["NIKAH", "WALIMA", "MEHNDI"];
  const toast: EventKind[] = ["CHURCH", "RECEPTION", "ENGAGEMENT"];
  if (kinds.some((k) => dry.includes(k))) return "petals";
  return kinds.some((k) => toast.includes(k)) ? "champagne" : "petals";
}

/** Small seeded PRNG so server and client place every motif identically (no hydration mismatch). */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const GOLD = "var(--cw-gold-300)";
const GOLD_DEEP = "var(--cw-gold-400)";
const GREEN = "var(--cw-leaf-800)";
const CREAM = "var(--cw-ivory-0)";
const LABEL = "var(--cw-gold-100)";
const CHAMPAGNE = "var(--cw-champagne)";
const BUBBLE = "var(--cw-saffron-300)";
const PETAL = "var(--cw-lotus-100)";
const PETAL_EDGE = "var(--cw-sand)";
const PETAL_HEART = "var(--cw-saffron-300)";

function Bottle() {
  return (
    <svg viewBox="0 0 60 150" width="100%" height="100%" aria-hidden>
      <path
        d="M22 8 h16 v18 C38 40 48 46 48 64 v74 a10 10 0 0 1 -10 10 h-16 a10 10 0 0 1 -10 -10 v-74 C12 46 22 40 22 26 Z"
        fill={GREEN}
      />
      <rect x="12" y="84" width="36" height="34" fill={LABEL} />
      <rect x="17" y="94" width="26" height="2.5" rx="1.25" fill={GOLD_DEEP} />
      <rect x="21" y="102" width="18" height="2.5" rx="1.25" fill={GOLD_DEEP} />
      <rect x="21" y="2" width="18" height="16" rx="3" fill={GOLD} />
    </svg>
  );
}

function Glasses() {
  return (
    <svg viewBox="0 0 120 130" width="100%" height="100%" aria-hidden>
      <g transform="rotate(7 34 120)">
        <path d="M14 8 h40 l-5 66 q-15 13 -30 0 z" fill={CHAMPAGNE} stroke={GOLD_DEEP} strokeWidth="1.5" />
        <path d="M16 32 h36 l-3 42 q-15 13 -30 0 z" fill={BUBBLE} />
        <rect x="32" y="82" width="4" height="36" fill={GOLD_DEEP} />
        <ellipse cx="34" cy="120" rx="18" ry="4" fill={GOLD_DEEP} />
      </g>
      <g transform="rotate(-7 86 120)">
        <path d="M66 8 h40 l-5 66 q-15 13 -30 0 z" fill={CHAMPAGNE} stroke={GOLD_DEEP} strokeWidth="1.5" />
        <path d="M68 32 h36 l-3 42 q-15 13 -30 0 z" fill={BUBBLE} />
        <rect x="84" y="82" width="4" height="36" fill={GOLD_DEEP} />
        <ellipse cx="86" cy="120" rx="18" ry="4" fill={GOLD_DEEP} />
      </g>
    </svg>
  );
}

function Petal({ hue }: { hue: number }) {
  // Frangipani-ish petal: cream with a warm yellow heart.
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden>
      <path
        d="M20 2 C32 8 34 26 20 38 C6 26 8 8 20 2 Z"
        fill={hue ? PETAL : CREAM}
        stroke={PETAL_EDGE}
        strokeWidth="1"
      />
      <path d="M20 22 C25 26 24 34 20 38 C16 34 15 26 20 22 Z" fill={PETAL_HEART} opacity="0.9" />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden>
      <path d="M10 0 l2.6 7.4 L20 10 l-7.4 2.6 L10 20 l-2.6 -7.4 L0 10 l7.4 -2.6 Z" fill={GOLD} />
    </svg>
  );
}

type Item = {
  kind: "bottle" | "glasses" | "petal" | "sparkle" | "bubble";
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  rotate: number;
  hue: number;
};

export function CelebrationBackdrop({
  theme,
  seed = 7,
  density = "full",
  className,
}: {
  theme: CelebrationTheme;
  seed?: number;
  /** `full` frames a large section (hero); `small` is a light touch around a button. */
  density?: "full" | "small";
  className?: string;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const items = useMemo<Item[]>(() => {
    const rand = seeded(seed);
    const out: Item[] = [];
    const add = (kind: Item["kind"], count: number, size: [number, number], duration: [number, number]) => {
      for (let i = 0; i < count; i++) {
        // Big motifs live in the side gutters so they never sit behind the content column.
        const big = kind === "bottle" || kind === "glasses";
        const side = rand();
        out.push({
          kind,
          left: big ? (side < 0.5 ? rand() * 1.5 : 93 + rand() * 1.5) : rand() * 100,
          top: rand() * 100,
          size: size[0] + rand() * (size[1] - size[0]),
          delay: -rand() * duration[1],
          duration: duration[0] + rand() * (duration[1] - duration[0]),
          rotate: -30 + rand() * 60,
          hue: rand() > 0.6 ? 1 : 0,
        });
      }
    };
    const small = density === "small";
    if (theme === "champagne") {
      if (!small) add("bottle", 3, [44, 56], [14, 20]);
      add("glasses", small ? 2 : 3, small ? [44, 56] : [46, 56], [12, 18]);
      add("bubble", small ? 6 : 10, [5, 10], [5, 9]);
    } else {
      add("petal", small ? 6 : 10, small ? [14, 20] : [18, 28], [8, 14]);
    }
    add("sparkle", small ? 5 : 8, [10, 16], [2.5, 5]);
    return out;
  }, [theme, seed, density]);

  return (
    <div
      aria-hidden
      className={"cwcb pointer-events-none absolute inset-0 -z-10 overflow-hidden " + (className ?? "")}
      data-paused={paused || undefined}
      style={{ "--fall": density === "small" ? "170px" : "520px" } as React.CSSProperties}
    >
      <style>{`
        @keyframes cwcb-drift { 0% { transform: translate3d(0, 8px, 0) rotate(var(--r)); } 50% { transform: translate3d(6px, -8px, 0) rotate(calc(var(--r) * -1)); } 100% { transform: translate3d(0, 8px, 0) rotate(var(--r)); } }
        @keyframes cwcb-fall { 0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translate3d(30px, var(--fall, 420px), 0) rotate(360deg); opacity: 0; } }
        @keyframes cwcb-rise { 0% { transform: translate3d(0, 30px, 0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translate3d(6px, -90px, 0); opacity: 0; } }
        @keyframes cwcb-twinkle { 0%, 100% { transform: scale(.3); opacity: 0; } 50% { transform: scale(1); opacity: 1; } }
        .cwcb > span { position: absolute; display: block; will-change: transform, opacity; }
        .cwcb [data-k="bottle"], .cwcb [data-k="glasses"] { animation: cwcb-drift var(--d) ease-in-out var(--delay) infinite; opacity: .35; }
        .cwcb [data-k="petal"] { top: 0 !important; animation: cwcb-fall var(--d) linear var(--delay) infinite; opacity: .8; }
        .cwcb [data-k="bubble"] { animation: cwcb-rise var(--d) ease-in var(--delay) infinite; border-radius: 9999px; border: 1px solid ${GOLD_DEEP}; background: ${CREAM}; opacity: .5; }
        .cwcb [data-k="sparkle"] { animation: cwcb-twinkle var(--d) ease-in-out var(--delay) infinite; }
        .cwcb[data-paused] > span { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .cwcb > span { animation: none !important; opacity: .18 !important; } .cwcb [data-k="petal"] { top: var(--top) !important; } }
        @media (max-width: 640px) { .cwcb [data-k="bottle"] { display: none; } }
      `}</style>
      {items.map((item, i) => (
        <span
          key={i}
          data-k={item.kind}
          style={
            {
              left: `${item.left}%`,
              top: `${item.top}%`,
              width: item.kind === "bottle" ? item.size * 0.4 : item.size,
              height: item.kind === "bottle" ? item.size : item.kind === "glasses" ? item.size * 1.08 : item.size,
              "--d": `${item.duration}s`,
              "--delay": `${item.delay}s`,
              "--r": `${item.rotate}deg`,
              "--top": `${item.top}%`,
            } as React.CSSProperties
          }
        >
          {item.kind === "bottle" ? (
            <Bottle />
          ) : item.kind === "glasses" ? (
            <Glasses />
          ) : item.kind === "petal" ? (
            <Petal hue={item.hue} />
          ) : item.kind === "sparkle" ? (
            <Sparkle />
          ) : null}
        </span>
      ))}
    </div>
  );
}
