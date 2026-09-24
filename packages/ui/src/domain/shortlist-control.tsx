"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { SPRING_BOUNCY } from "../motion/tokens";
import { useConfetti } from "../motion/celebration";
import { Icon } from "../components/icon";

/**
 * A shortlist / save-to-team toggle button with a heart-pop spring
 * animation on save and a localised pink particle burst.
 *
 * Reduced-motion: instant colour transition only, no confetti.
 */
export function ShortlistControl({
  saved,
  onToggle,
  className,
  label = "Save to team",
}: {
  saved?: boolean;
  onToggle?: () => void;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { heartBurst } = useConfetti();

  // Drive the heart-pop animation by keying the motion.span
  const [popKey, setPopKey] = useState(0);
  const prevSaved = useRef(saved);

  useEffect(() => {
    if (saved && !prevSaved.current) {
      // Trigger keyframe animation re-mount
      setPopKey((k) => k + 1);
      // Confetti burst from button centre
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        void heartBurst({
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        });
      }
    }
    prevSaved.current = saved;
  }, [saved, heartBurst]);

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-pressed={saved}
      whileTap={{ scale: 0.88 }}
      transition={SPRING_BOUNCY}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        saved
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-secondary",
        className,
      )}
      onClick={onToggle}
    >
      {/* Heart icon with spring pop keyframes on save */}
      <motion.span
        key={popKey}
        className="inline-flex items-center"
        animate={saved ? { scale: [1, 0, 1.35, 1] } : { scale: 1 }}
        transition={
          saved
            ? { duration: 0.38, ease: [0.22, 1, 0.36, 1], times: [0, 0.25, 0.7, 1] }
            : SPRING_BOUNCY
        }
      >
        <Icon
          icon={Heart}
          size="sm"
          animation={saved ? "fill" : "default"}
          animate={saved || undefined}
          animateOnHover
        />
      </motion.span>
      {saved ? "Saved" : label}
    </motion.button>
  );
}
