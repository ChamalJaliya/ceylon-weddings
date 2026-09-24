"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/utils";
import { DecorationBlockView, type StageBlock, type StageSlot } from "./decoration-block";
import { motion, useReducedMotion } from "./motion";

export type { StageBlock, StageSlot } from "./decoration-block";

export type StagePresentationView = {
  blocks: StageBlock[];
};

function blocksFor(presentation: StagePresentationView | null | undefined, slot: StageSlot) {
  if (!presentation) return [];
  return presentation.blocks
    .filter((block) => block.slot === slot)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Onboarding screen shell: an admin-authored decoration rail on each side of a
 * question card that stays optically centered.
 *
 * Both side rails are `minmax(0,1fr)` tracks, so the card column sits in the exact
 * middle of the stage no matter how much content one rail holds. Below `lg` the
 * grid collapses to a single column ordered top, left, card, right, bottom.
 */
export function OnboardingStage({
  presentation,
  children,
  className,
  cardClassName,
  cardMaxWidth = "48rem",
  cardMinHeight,
  animateCardHeight = true,
}: {
  presentation?: StagePresentationView | null;
  children: ReactNode;
  className?: string;
  cardClassName?: string;
  /** Width of the centered card track. */
  cardMaxWidth?: string;
  /** Height floor so the card does not jump between short and tall steps. */
  cardMinHeight?: number;
  animateCardHeight?: boolean;
}) {
  const reduce = useReducedMotion();

  const top = blocksFor(presentation, "TOP");
  const left = blocksFor(presentation, "LEFT");
  const right = blocksFor(presentation, "RIGHT");
  const bottom = blocksFor(presentation, "BOTTOM");

  return (
    <div
      style={{ "--cw-stage-card": cardMaxWidth } as CSSProperties}
      className={cn(
        "grid w-full grid-cols-1 gap-6",
        "lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--cw-stage-card))_minmax(0,1fr)] lg:gap-8",
        className,
      )}
    >
      {top.length ? (
        <StageRail blocks={top} className="lg:col-span-3 lg:row-start-1 lg:justify-items-center" />
      ) : null}

      {left.length ? (
        <StageRail
          blocks={left}
          className="lg:col-start-1 lg:row-start-2 lg:self-center lg:justify-self-end lg:max-w-xs"
        />
      ) : null}

      <motion.div
        layout={animateCardHeight && !reduce}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        style={cardMinHeight ? { minHeight: cardMinHeight } : undefined}
        className={cn(
          "w-full min-w-0 justify-self-center lg:col-start-2 lg:row-start-2",
          cardClassName,
        )}
      >
        {children}
      </motion.div>

      {right.length ? (
        <StageRail
          blocks={right}
          className="lg:col-start-3 lg:row-start-2 lg:self-center lg:justify-self-start lg:max-w-xs"
        />
      ) : null}

      {bottom.length ? (
        <StageRail
          blocks={bottom}
          className="lg:col-span-3 lg:row-start-3 lg:justify-items-center"
        />
      ) : null}
    </div>
  );
}

function StageRail({ blocks, className }: { blocks: StageBlock[]; className?: string }) {
  return (
    <div className={cn("grid min-w-0 gap-5 overflow-hidden", className)}>
      {blocks.map((block) => (
        <DecorationBlockView key={block.id} block={block} />
      ))}
    </div>
  );
}
