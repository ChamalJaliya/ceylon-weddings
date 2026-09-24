"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/button";
import { cn } from "../lib/utils";
import { motion, useReducedMotion } from "./motion";
import { OnboardingStage, type StagePresentationView } from "./onboarding-stage";
import { DURATION, EASE_IN_OUT_SMOOTH } from "../motion/tokens";

/**
 * Direction for question-to-question switches.
 * `1` = forward (panel enters from the right), `-1` = back (from the left).
 */
export type WizardDirection = 1 | -1;

const SWEEP_EASE = [0.77, 0, 0.175, 1] as const;
const SWEEP_DURATION = DURATION.DELIBERATE;

/**
 * Track slide direction from an ordered list of step keys.
 */
export function useWizardDirection(
  stepKey: string | number,
  order: readonly (string | number)[],
): WizardDirection {
  const prevRef = useRef(stepKey);
  const [direction, setDirection] = useState<WizardDirection>(1);

  useEffect(() => {
    const from = order.indexOf(prevRef.current);
    const to = order.indexOf(stepKey);
    if (from !== -1 && to !== -1 && from !== to) {
      setDirection(to > from ? 1 : -1);
    }
    prevRef.current = stepKey;
  }, [order, stepKey]);

  return direction;
}

type Snapshot = {
  stepKey: string | number | undefined;
  stepLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

type SweepPhase = "idle" | "cover" | "reveal";

/**
 * Multi-step onboarding wizard.
 *
 * Auth-switch style: a primary-coloured panel sweeps across the question,
 * covering the previous step, then exits to reveal the next. Keep a single
 * mounted shell and change `stepKey` — remounting skips the sweep.
 */
export function OnboardWizard({
  stepLabel,
  title,
  description,
  children,
  onBack,
  onContinue,
  onSkip,
  continueLabel = "Continue",
  skipLabel = "Skip",
  continueDisabled,
  saving,
  className,
  stepKey,
  direction = 1,
  progress,
  stage,
}: {
  stepLabel?: string;
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  skipLabel?: string;
  continueDisabled?: boolean;
  saving?: boolean;
  className?: string;
  stepKey?: string | number;
  direction?: WizardDirection;
  progress?: { current: number; total: number };
  /** Admin-authored decorations rendered around the centered wizard card. */
  stage?: StagePresentationView | null;
}) {
  const incoming = { stepKey, stepLabel, title, description, children };
  const incomingRef = useRef(incoming);
  incomingRef.current = incoming;

  const [visible, setVisible] = useState<Snapshot>(incoming);
  const [phase, setPhase] = useState<SweepPhase>("idle");
  const [sweepDir, setSweepDir] = useState<WizardDirection>(direction);
  const reduce = useReducedMotion();

  const switching = stepKey !== undefined && visible.stepKey !== stepKey;

  if (switching && phase === "idle" && !reduce) {
    setSweepDir(direction);
    setPhase("cover");
  }

  useEffect(() => {
    if (!switching) return;
    if (reduce) {
      setVisible(incomingRef.current);
    }
  }, [reduce, switching]);

  const sweeping = phase !== "idle";
  const enterX = sweepDir === 1 ? "101%" : "-101%";
  const exitX = sweepDir === 1 ? "-101%" : "101%";
  const overlayX = phase === "cover" ? "0%" : exitX;
  const display = phase === "cover" || (switching && phase === "idle") ? visible : incoming;

  const ratio =
    progress && progress.total > 0 ? Math.min(1, Math.max(0, progress.current / progress.total)) : null;

  const panel = (
    <div className="grid gap-6 rounded-[1.5rem] border border-border/70 bg-card/70 p-5 shadow-sm md:p-7">
      <header className="grid gap-1.5">
        {display.stepLabel ? (
          <p className="text-[11px] font-medium tracking-[0.2em] text-primary/80 uppercase">{display.stepLabel}</p>
        ) : null}
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-[2rem] sm:leading-tight">
          {display.title}
        </h1>
        {display.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{display.description}</p>
        ) : null}
      </header>
      {display.children}
    </div>
  );

  const shell = (
    <div className={cn("grid w-full gap-6 overflow-visible", !stage && "mx-auto max-w-3xl", className)}>
      {ratio !== null ? (
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ duration: DURATION.SLOW, ease: EASE_IN_OUT_SMOOTH }}
          />
        </div>
      ) : null}

      {stepKey !== undefined ? (
        <div className="relative overflow-visible">
          {panel}
          {reduce || phase === "idle" ? null : (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[1.5rem] bg-primary text-primary-foreground"
              initial={{ x: enterX }}
              animate={{ x: overlayX }}
              transition={{ duration: SWEEP_DURATION, ease: SWEEP_EASE }}
              onAnimationComplete={() => {
                if (phase === "cover") {
                  setVisible(incomingRef.current);
                  setPhase("reveal");
                  return;
                }
                if (phase === "reveal") {
                  setPhase("idle");
                }
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full border border-primary-foreground/15"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -bottom-20 size-52 rounded-full border border-primary-foreground/10"
              />
              <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="font-serif text-3xl font-semibold tracking-tight">Ceylon</p>
                {incoming.stepLabel ? (
                  <p className="text-[11px] font-medium tracking-[0.22em] uppercase opacity-80">
                    {incoming.stepLabel}
                  </p>
                ) : null}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        panel
      )}

      {(onBack || onContinue || onSkip) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <Button type="button" variant="ghost" onClick={onBack} disabled={sweeping || saving}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {onSkip ? (
              <Button type="button" variant="outline" onClick={onSkip} disabled={sweeping || saving}>
                {skipLabel}
              </Button>
            ) : null}
            {onContinue ? (
              <Button
                type="button"
                iconRight={ArrowRight}
                onClick={onContinue}
                disabled={continueDisabled || sweeping || saving}
              >
                {saving ? "Saving…" : continueLabel}
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  if (!stage) return shell;

  return (
    <OnboardingStage presentation={stage} className="mx-auto w-full max-w-7xl">
      {shell}
    </OnboardingStage>
  );
}
