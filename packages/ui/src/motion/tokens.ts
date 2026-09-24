export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_SMOOTH = [0.4, 0, 0.2, 1] as const;
export const EASE_EMPHASIZED = [0.2, 0, 0, 1] as const;

export const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const SPRING_BOUNCY = {
  type: "spring" as const,
  stiffness: 420,
  damping: 22,
};

export const SPRING_SMOOTH = {
  type: "spring" as const,
  stiffness: 300,
  damping: 28,
};

export const SPRING_GENTLE = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

export const DURATION = {
  FAST: 0.15,
  NORMAL: 0.25,
  SLOW: 0.4,
  DELIBERATE: 0.6,
} as const;

export const MOTION_TIMINGS = {
  easeOut: EASE_OUT_EXPO,
  easeInOut: EASE_IN_OUT_SMOOTH,
  duration: DURATION,
  spring: {
    snappy: SPRING_SNAPPY,
    bouncy: SPRING_BOUNCY,
    smooth: SPRING_SMOOTH,
    gentle: SPRING_GENTLE,
  },
} as const;
