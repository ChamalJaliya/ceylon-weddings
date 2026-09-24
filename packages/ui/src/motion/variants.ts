import type { Variants } from "motion/react";
import { EASE_OUT_EXPO, SPRING_SNAPPY, SPRING_SMOOTH, DURATION } from "./tokens";

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: DURATION.NORMAL, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.FAST },
  },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.SLOW, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: DURATION.FAST },
  },
};

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.SLOW, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.FAST },
  },
};

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: SPRING_SNAPPY,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: DURATION.FAST },
  },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING_SNAPPY,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: DURATION.FAST },
  },
};

export const drawerVariants = (side: "left" | "right" | "top" | "bottom"): Variants => {
  const directionMap = {
    left: { x: "-100%", y: 0 },
    right: { x: "100%", y: 0 },
    top: { x: 0, y: "-100%" },
    bottom: { x: 0, y: "100%" },
  };

  return {
    hidden: { opacity: 0, ...directionMap[side] },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: SPRING_SMOOTH,
    },
    exit: {
      opacity: 0,
      ...directionMap[side],
      transition: { duration: DURATION.FAST },
    },
  };
};

export const staggerContainerVariants = (staggerDelay = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
});

export const accordionVariants: Variants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  show: {
    opacity: 1,
    height: "auto",
    transition: {
      height: SPRING_SMOOTH,
      opacity: { duration: DURATION.NORMAL, ease: EASE_OUT_EXPO },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: DURATION.NORMAL, ease: EASE_OUT_EXPO },
      opacity: { duration: DURATION.FAST },
    },
  },
};

export const hoverLiftVariants: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: SPRING_SNAPPY,
  },
  tap: {
    scale: 0.98,
    transition: SPRING_SNAPPY,
  },
};
