"use client";

import * as React from "react";
import {
  MotionConfig,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  AnimatePresence,
  type HTMLMotionProps,
} from "motion/react";
import { cn } from "../lib/utils";
import {
  SPRING_SNAPPY,
  SPRING_BOUNCY,
  SPRING_SMOOTH,
  SPRING_GENTLE,
  EASE_OUT_EXPO,
  DURATION,
  MOTION_TIMINGS,
} from "../motion/tokens";
import {
  fadeVariants,
  slideUpVariants,
  slideDownVariants,
  scaleUpVariants,
  modalVariants,
  drawerVariants,
  staggerContainerVariants,
  accordionVariants,
  hoverLiftVariants,
} from "../motion/variants";

export { MOTION_TIMINGS, SPRING_SNAPPY, SPRING_BOUNCY, SPRING_SMOOTH, SPRING_GENTLE, EASE_OUT_EXPO, DURATION };
export { fadeVariants, slideUpVariants, slideDownVariants, scaleUpVariants, modalVariants, drawerVariants };

/**
 * Global Motion Provider to enforce accessible reduced-motion standards and motion defaults.
 */
export function CwMotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ==========================================================================
   1. REVEAL & STAGGER (Scroll-Driven & Entrance Animations)
   ========================================================================== */

type Direction = "up" | "down" | "left" | "right" | "none";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  distance?: number;
  y?: number;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  distance,
  y = 16,
  once = true,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  const dist = distance ?? y;

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: dist, x: 0 };
      case "down":
        return { opacity: 0, y: -dist, x: 0 };
      case "left":
        return { opacity: 0, x: dist, y: 0 };
      case "right":
        return { opacity: 0, x: -dist, y: 0 };
      case "none":
        return { opacity: 0, x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={reduce ? false : getInitialPosition()}
      whileInView={reduce ? undefined : { opacity: 1, x: 0, y: 0 }}
      animate={reduce ? { opacity: 1, x: 0, y: 0 } : undefined}
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      transition={{ duration: DURATION.SLOW, delay, ease: EASE_OUT_EXPO }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const staggerContext = React.createContext(false);

type StaggerProps = {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  /** `inView` waits for scroll; `immediate` is for lists that replace children (pagination). */
  trigger?: "inView" | "immediate";
} & Omit<HTMLMotionProps<"div">, "children">;

export function Stagger({
  children,
  className,
  stagger = 0.06,
  delay = 0,
  trigger = "inView",
  ...props
}: StaggerProps) {
  const reduce = useReducedMotion();
  const immediate = trigger === "immediate" || Boolean(reduce);

  return (
    <staggerContext.Provider value={true}>
      <motion.div
        className={className}
        initial={reduce ? false : "hidden"}
        whileInView={immediate ? undefined : "show"}
        animate={immediate ? "show" : undefined}
        viewport={immediate ? undefined : { once: true, margin: "0px 0px -6% 0px" }}
        variants={staggerContainerVariants(stagger, delay)}
        {...props}
      >
        {children}
      </motion.div>
    </staggerContext.Provider>
  );
}

type StaggerItemProps = {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  distance?: number;
  y?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

export function StaggerItem({ children, className, direction = "up", distance, y = 14, ...props }: StaggerItemProps) {
  const reduce = useReducedMotion();
  const inStagger = React.useContext(staggerContext);
  const dist = distance ?? y;

  if (!inStagger) {
    return (
      <Reveal className={className} direction={direction} distance={dist} {...props}>
        {children}
      </Reveal>
    );
  }

  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: dist, x: 0 };
      case "down":
        return { opacity: 0, y: -dist, x: 0 };
      case "left":
        return { opacity: 0, x: dist, y: 0 };
      case "right":
        return { opacity: 0, x: -dist, y: 0 };
      case "none":
        return { opacity: 0, x: 0, y: 0 };
    }
  };

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1, x: 0, y: 0 } : getInitialPosition(),
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: DURATION.NORMAL, ease: EASE_OUT_EXPO },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ==========================================================================
   2. INTERACTIVE WRAPPERS & CARDS (Micro-interactions)
   ========================================================================== */

type PressableProps = {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  hoverScale?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Pressable({
  children,
  className,
  scale = 0.97,
  hoverScale = 1.02,
  ...props
}: PressableProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn("inline-flex cursor-pointer select-none", className)}
      whileHover={reduce ? undefined : { scale: hoverScale }}
      whileTap={reduce ? undefined : { scale }}
      transition={SPRING_BOUNCY}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type InteractiveCardProps = {
  children: React.ReactNode;
  className?: string;
  hoverY?: number;
  hoverScale?: number;
  glow?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function InteractiveCard({
  children,
  className,
  hoverY = -4,
  hoverScale = 1.01,
  glow = false,
  ...props
}: InteractiveCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border border-border bg-card transition-colors duration-200",
        glow && "hover:border-primary/40 hover:shadow-card",
        className,
      )}
      whileHover={reduce ? undefined : { y: hoverY, scale: hoverScale }}
      whileTap={reduce ? undefined : { scale: 0.99 }}
      transition={SPRING_SNAPPY}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ==========================================================================
   3. DYNAMIC LISTS & REORDERING
   ========================================================================== */

type AnimatedListProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">;

export function AnimatedList({ children, className, ...props }: AnimatedListProps) {
  return (
    <motion.div className={className} layout {...props}>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </motion.div>
  );
}

type AnimatedListItemProps = {
  children: React.ReactNode;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "children">;

export function AnimatedListItem({ children, className, ...props }: AnimatedListItemProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: -10 }}
      transition={SPRING_SMOOTH}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ==========================================================================
   4. ANIMATED TABS & NAVIGATION SWITCHERS
   ========================================================================== */

type AnimatedTabsProps<T extends string> = {
  tabs: { id: T; label: React.ReactNode; badge?: React.ReactNode }[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  tabClassName?: string;
  activePillClassName?: string;
  layoutId?: string;
};

export function AnimatedTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  className,
  tabClassName,
  activePillClassName,
  layoutId = "activeTabPill",
}: AnimatedTabsProps<T>) {
  const reduce = useReducedMotion();

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-muted/60 p-1 text-muted-foreground", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive ? "text-foreground font-semibold" : "hover:text-foreground/80",
              tabClassName,
            )}
          >
            {isActive && (
              <motion.div
                layoutId={reduce ? undefined : layoutId}
                className={cn("absolute inset-0 -z-10 rounded-lg bg-card shadow-sm border border-border/50", activePillClassName)}
                transition={SPRING_SNAPPY}
              />
            )}
            <span>{tab.label}</span>
            {tab.badge ? <span className="ml-1">{tab.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   5. ANIMATED NUMERIC COUNTER / TICKER
   ========================================================================== */

type AnimatedCounterProps = {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
  duration?: number;
};

export function AnimatedCounter({ value, formatter, className, duration = 1 }: AnimatedCounterProps) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { mass: 0.8, stiffness: 120, damping: 20 });
  const display = useTransform(spring, (current) =>
    formatter ? formatter(Math.round(current)) : Math.round(current).toLocaleString(),
  );

  React.useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  if (reduce) {
    return <span className={className}>{formatter ? formatter(value) : value.toLocaleString()}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}

/* ==========================================================================
   6. ANIMATED COLLAPSIBLE / ACCORDION
   ========================================================================== */

type AnimatedCollapsibleProps = {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
};

export function AnimatedCollapsible({ isOpen, children, className }: AnimatedCollapsibleProps) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          className={cn("overflow-hidden", className)}
          initial={reduce ? false : "hidden"}
          animate="show"
          exit="exit"
          variants={accordionVariants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ==========================================================================
   7. PAGE TRANSITION CONTAINER
   ========================================================================== */

type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: DURATION.NORMAL, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/* ==========================================================================
   8. PULSE DOT & ANIMATED BADGE
   ========================================================================== */

export function PulseDot({ className, colorClass = "bg-primary" }: { className?: string; colorClass?: string }) {
  const reduce = useReducedMotion();

  return (
    <span className={cn("relative flex h-2.5 w-2.5 items-center justify-center", className)}>
      {!reduce && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            colorClass,
          )}
        />
      )}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", colorClass)} />
    </span>
  );
}

export function AnimatedBadge({
  children,
  className,
  pulse = false,
}: {
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors",
        pulse && "cw-pulse-subtle",
        className,
      )}
      whileHover={{ scale: 1.05 }}
      transition={SPRING_SNAPPY}
    >
      {children}
    </motion.span>
  );
}

/* ==========================================================================
   EXPORTS
   ========================================================================== */

export { CelebrationBurst, SaveTheDateBurst, useConfetti } from "./celebration-burst";

export { motion, useReducedMotion, AnimatePresence, useSpring, useTransform };
