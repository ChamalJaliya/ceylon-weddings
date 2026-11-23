import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AccessibilityInfo } from "react-native";
import { Easing, FadeIn, FadeInDown, LinearTransition, type EntryOrExitLayoutType } from "react-native-reanimated";

/**
 * Motion system — purposeful, interruptible, fast.
 * Prefer springs for interactive gestures; smooth ease-out for entrances.
 * Always honor Reduce Motion (system setting).
 */

export const MOTION_MS = 280;
export const MOTION_FAST_MS = 160;
export const MOTION_SLOW_MS = 400;

/** Smooth ease-out — entrances, collapses, morphs. */
export const SMOOTH = { duration: MOTION_MS, easing: Easing.bezier(0.22, 1, 0.36, 1) };
export const SMOOTH_FAST = { duration: MOTION_FAST_MS, easing: Easing.bezier(0.22, 1, 0.36, 1) };
export const SMOOTH_SLOW = { duration: MOTION_SLOW_MS, easing: Easing.bezier(0.22, 1, 0.36, 1) };

/** Snappy interactive spring — presses, pills, sheets following the finger. */
export const SPRING_SNAPPY = { damping: 18, stiffness: 280, mass: 0.7 };
/** Softer settle — hero text, large cards. */
export const SPRING_SOFT = { damping: 20, stiffness: 180, mass: 0.9 };

/** Shared layout animation for list add/remove/reorder. */
export const LAYOUT = LinearTransition.duration(MOTION_MS).easing(Easing.bezier(0.22, 1, 0.36, 1));

const ReducedCtx = createContext(false);

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return createElement(ReducedCtx.Provider, { value: reduced }, children);
}

export function useReducedMotion() {
  return useContext(ReducedCtx);
}

/** Entrance that becomes an instant fade (or nothing) when Reduce Motion is on. */
export function useEnter(delay = 0, kind: "down" | "fade" = "down"): EntryOrExitLayoutType | undefined {
  const reduced = useReducedMotion();
  return useMemo(() => {
    if (reduced) return FadeIn.duration(MOTION_FAST_MS);
    if (kind === "fade") return FadeIn.delay(delay).duration(MOTION_MS);
    return FadeInDown.delay(delay).duration(MOTION_MS);
  }, [reduced, delay, kind]);
}
