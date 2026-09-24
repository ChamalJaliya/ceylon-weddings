"use client";

import { Lottie } from "lottie-react";
import { cn } from "../lib/utils";
import { ICON_STROKE } from "../contracts/icon";
import {
  ANIMATED_ICON_NAMES,
  resolveAnimatedIconByName,
} from "../components/animate-ui/icons/registry";
import { motion, useReducedMotion } from "./motion";

export { ANIMATED_ICON_NAMES };

export type StageSlot = "LEFT" | "RIGHT" | "TOP" | "BOTTOM";
export type StageAlign = "START" | "CENTER" | "END";
export type StageBreakpoint = "MOBILE" | "TABLET" | "DESKTOP";
export type StageEntrance = "NONE" | "FADE" | "SLIDE" | "FLOAT";

type StageBlockBase = {
  id: string;
  slot: StageSlot;
  sortOrder: number;
  align: StageAlign;
  maxWidthPx?: number | null;
  hideOn: StageBreakpoint[];
  entrance: StageEntrance;
  delayMs: number;
};

/**
 * Decoration blocks as the renderer needs them: identical to the stored shape
 * except localized strings are already resolved for the active locale.
 */
export type StageBlock =
  | (StageBlockBase & {
      kind: "TEXT";
      heading?: string | null;
      body?: string | null;
      tone: "DEFAULT" | "MUTED" | "ACCENT";
    })
  | (StageBlockBase & {
      kind: "ICON";
      iconName: string;
      label?: string | null;
      size: "SM" | "MD" | "LG" | "XL";
      motion: "HOVER" | "LOOP" | "ONCE";
    })
  | (StageBlockBase & {
      kind: "IMAGE";
      src: string;
      alt?: string | null;
      fit: "COVER" | "CONTAIN";
      rounded: boolean;
      aspect?: string | null;
    })
  | (StageBlockBase & {
      kind: "LOTTIE";
      src: string;
      loop: boolean;
      autoplay: boolean;
      speed: number;
    })
  | (StageBlockBase & {
      kind: "VIDEO";
      src: string;
      poster?: string | null;
      loop: boolean;
      autoplay: boolean;
    });

const ICON_PX: Record<"SM" | "MD" | "LG" | "XL", number> = { SM: 32, MD: 48, LG: 72, XL: 112 };

const ALIGN_CLASS: Record<StageAlign, string> = {
  START: "items-start text-left",
  CENTER: "items-center text-center",
  END: "items-end text-right",
};

const HIDE_CLASS: Record<StageBreakpoint, string> = {
  MOBILE: "max-sm:hidden",
  TABLET: "max-lg:sm:hidden",
  DESKTOP: "lg:hidden",
};

const TEXT_TONE_CLASS = {
  DEFAULT: "text-foreground",
  MUTED: "text-muted-foreground",
  ACCENT: "text-primary",
} as const;

/** Slide direction points inward, away from the edge the block sits on. */
const SLIDE_OFFSET: Record<StageSlot, { x: number; y: number }> = {
  LEFT: { x: -24, y: 0 },
  RIGHT: { x: 24, y: 0 },
  TOP: { x: 0, y: -20 },
  BOTTOM: { x: 0, y: 20 },
};

/** Static icon render for admin pickers and previews. */
export function StageIconPreview({
  name,
  size = 24,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Animated = resolveAnimatedIconByName(name);
  if (!Animated) return null;
  return <Animated size={size} strokeWidth={ICON_STROKE} className={className} aria-hidden />;
}

export function DecorationBlockView({ block, className }: { block: StageBlock; className?: string }) {
  const reduce = useReducedMotion();

  const initial = (() => {
    if (reduce || block.entrance === "NONE") return false as const;
    if (block.entrance === "SLIDE") return { opacity: 0, ...SLIDE_OFFSET[block.slot] };
    return { opacity: 0 };
  })();

  const animate =
    !reduce && block.entrance === "FLOAT"
      ? { opacity: 1, x: 0, y: [0, -8, 0] }
      : { opacity: 1, x: 0, y: 0 };

  const transition =
    !reduce && block.entrance === "FLOAT"
      ? {
          opacity: { duration: 0.5, delay: block.delayMs / 1000 },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" as const },
        }
      : { duration: 0.45, delay: block.delayMs / 1000, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      style={block.maxWidthPx ? { maxWidth: block.maxWidthPx } : undefined}
      className={cn(
        "flex w-full flex-col gap-2",
        ALIGN_CLASS[block.align],
        block.hideOn.map((breakpoint) => HIDE_CLASS[breakpoint]),
        className,
      )}
    >
      <BlockBody block={block} />
    </motion.div>
  );
}

function BlockBody({ block }: { block: StageBlock }) {
  const reduce = useReducedMotion();

  switch (block.kind) {
    case "TEXT":
      return (
        <div className={cn("grid gap-1.5", TEXT_TONE_CLASS[block.tone])}>
          {block.heading ? (
            <p className="font-serif text-xl font-semibold leading-tight sm:text-2xl">{block.heading}</p>
          ) : null}
          {block.body ? (
            <p
              className={cn(
                "text-sm leading-relaxed",
                block.tone === "DEFAULT" ? "text-muted-foreground" : undefined,
              )}
            >
              {block.body}
            </p>
          ) : null}
        </div>
      );

    case "ICON": {
      const Animated = resolveAnimatedIconByName(block.iconName);
      if (!Animated) return null;
      const px = ICON_PX[block.size];
      const looping = block.motion === "LOOP" && !reduce;
      return (
        <div className="grid justify-items-center gap-2" aria-hidden>
          <Animated
            size={px}
            strokeWidth={ICON_STROKE}
            className="shrink-0 text-primary"
            animate={looping || (block.motion === "ONCE" && !reduce)}
            animateOnHover={block.motion === "HOVER"}
            loop={looping}
            loopDelay={600}
          />
          {block.label ? (
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {block.label}
            </span>
          ) : null}
        </div>
      );
    }

    case "IMAGE":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt ?? ""}
          loading="lazy"
          decoding="async"
          style={block.aspect ? { aspectRatio: block.aspect } : undefined}
          className={cn(
            "w-full",
            block.rounded && "rounded-2xl",
            block.fit === "COVER" ? "object-cover" : "object-contain",
          )}
          aria-hidden={block.alt ? undefined : true}
        />
      );

    case "LOTTIE":
      return (
        <span className="inline-flex w-full items-center justify-center" aria-hidden>
          <Lottie
            src={block.src}
            autoplay={block.autoplay && !reduce}
            loop={block.loop && !reduce}
            speed={block.speed}
            className="size-full"
          />
        </span>
      );

    case "VIDEO":
      return (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={block.src}
          poster={block.poster ?? undefined}
          autoPlay={block.autoplay && !reduce}
          loop={block.loop && !reduce}
          muted
          playsInline
          controls={Boolean(reduce)}
          preload="metadata"
          className="w-full rounded-2xl"
          aria-hidden
        />
      );
  }
}
