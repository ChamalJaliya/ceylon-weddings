"use client";

import type { SVGProps } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { ICON_STROKE, iconSizeMap, type IconComponent, type IconSize } from "../contracts/icon";
import {
  AnimateIcon,
  useAnimateIconContext,
  type IconProps as AnimateUiIconProps,
} from "./animate-ui/icons/icon";
import { resolveAnimatedIcon } from "./animate-ui/icons/registry";
import { LottieGlyph } from "../lottie/lottie-glyph";
import { resolveLottieAnimation, type LottieAnimationData } from "../lottie/registry";

export type { IconComponent, IconSize } from "../contracts/icon";
export { AnimateIcon, useAnimateIconContext };
export { resolveLottieAnimation };

type MotionTriggers = Pick<
  AnimateUiIconProps<string>,
  | "animate"
  | "animateOnHover"
  | "animateOnTap"
  | "animateOnView"
  | "animateOnViewOnce"
  | "animation"
  | "loop"
>;

const bounce = {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.1, 0.96, 1.06, 1],
    transition: { duration: 0.9, ease: "easeInOut" as const },
  },
};

function BounceGlyph({
  icon: Comp,
  px,
  className,
  ...props
}: {
  icon: IconComponent;
  px: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "ref" | "size" | "strokeWidth">) {
  const { controls } = useAnimateIconContext();
  return (
    <motion.span className={cn("inline-flex shrink-0", className)} variants={bounce} initial="initial" animate={controls}>
      <Comp data-icon="" size={px} strokeWidth={ICON_STROKE} aria-hidden {...props} />
    </motion.span>
  );
}

/**
 * Hybrid icon:
 * 1. Lottie (when mapped / `lottie` override) — frozen idle, loop on hover
 * 2. Explicit `animation` → animate-ui path morph
 * 3. Lucide animate-ui clone with GIF loop, else CSS pulse
 */
export function Icon({
  icon: Comp,
  size = "sm",
  className,
  animate,
  animateOnHover,
  animateOnTap,
  animateOnView,
  animateOnViewOnce,
  animation,
  loop,
  lottie,
  playing = false,
  ...props
}: {
  icon: IconComponent;
  size?: IconSize;
  className?: string;
  /** Lottie JSON override, or `false` to force Lucide for this instance. */
  lottie?: LottieAnimationData | false;
  /** Keep Lottie looping (selected / active). */
  playing?: boolean;
} & MotionTriggers &
  Omit<SVGProps<SVGSVGElement>, "ref" | "size" | "strokeWidth">) {
  const px = iconSizeMap[size];
  const parent = useAnimateIconContext();
  const nested = parent.controls !== undefined;
  const gifHover = animateOnHover !== false;
  const Animated = resolveAnimatedIcon(Comp);

  const lottieData =
    lottie === false ? undefined : (lottie ?? (!animation ? resolveLottieAnimation(Comp) : undefined));

  if (lottieData && (gifHover || playing)) {
    return (
      <LottieGlyph
        data={lottieData}
        size={px}
        className={className}
        playOnHover={gifHover}
        playing={playing}
      />
    );
  }

  if (animation && Animated) {
    return (
      <Animated
        data-icon=""
        size={px}
        strokeWidth={ICON_STROKE}
        className={cn("shrink-0", className)}
        aria-hidden
        animate={animate}
        animateOnHover={nested ? animateOnHover : (animateOnHover ?? true)}
        animateOnTap={nested ? animateOnTap : (animateOnTap ?? true)}
        animateOnView={animateOnView}
        animateOnViewOnce={animateOnViewOnce}
        animation={animation}
        loop={loop}
      />
    );
  }

  if (Animated && gifHover) {
    return (
      <Animated
        data-icon=""
        size={px}
        strokeWidth={ICON_STROKE}
        className={cn("shrink-0", className)}
        aria-hidden
        animate={animate}
        animateOnHover={nested ? animateOnHover : true}
        animateOnTap={nested ? animateOnTap : (animateOnTap ?? true)}
        animateOnView={animateOnView}
        animateOnViewOnce={animateOnViewOnce}
        loop={loop ?? true}
        loopDelay={280}
      />
    );
  }

  if (!animation) {
    return (
      <Comp
        data-icon=""
        size={px}
        strokeWidth={ICON_STROKE}
        className={cn("shrink-0 origin-center", gifHover && "cw-icon-gif", className)}
        aria-hidden
        {...props}
      />
    );
  }

  const glyph = <BounceGlyph icon={Comp} px={px} className={className} {...props} />;
  if (nested) return glyph;

  return (
    <AnimateIcon
      animate={animate}
      animateOnHover={animateOnHover ?? true}
      animateOnTap={animateOnTap ?? true}
      animateOnView={animateOnView}
      animateOnViewOnce={animateOnViewOnce}
      animation={animation}
      loop={loop}
    >
      {glyph}
    </AnimateIcon>
  );
}
