"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useConfetti } from "../motion/celebration";

export { useConfetti };

/**
 * Wrap any element with `<CelebrationBurst trigger={bool}>`.
 * When `trigger` flips from false→true a confetti burst fires
 * from the element's centre. Reduced-motion: no-op.
 *
 * @example
 * <CelebrationBurst trigger={saved} palette="heart">
 *   <ShortlistControl saved={saved} onToggle={toggle} />
 * </CelebrationBurst>
 */
export function CelebrationBurst({
  trigger,
  palette = "wedding",
  children,
}: {
  trigger: boolean;
  palette?: "wedding" | "heart";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { burst, heartBurst } = useConfetti();
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      const rect = ref.current?.getBoundingClientRect();
      const origin = rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : undefined;
      if (palette === "heart") {
        void heartBurst(origin);
      } else {
        void burst(origin);
      }
    }
    prevTrigger.current = trigger;
  }, [trigger, palette, burst, heartBurst]);

  return <div ref={ref} className="inline-flex">{children}</div>;
}

/**
 * Wraps any RSVP/save-the-date element.
 * When `trigger` flips to true, fires a full-screen 3-shot confetti shower.
 *
 * @example
 * <SaveTheDateBurst trigger={confirmed}>
 *   <ConfirmButton />
 * </SaveTheDateBurst>
 */
export function SaveTheDateBurst({
  trigger,
  children,
}: {
  trigger: boolean;
  children: ReactNode;
}) {
  const { saveDateBurst } = useConfetti();
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !prevTrigger.current) {
      void saveDateBurst();
    }
    prevTrigger.current = trigger;
  }, [trigger, saveDateBurst]);

  return <>{children}</>;
}
