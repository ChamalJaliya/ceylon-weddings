import { cva, type VariantProps } from "class-variance-authority";
import type { IconSize } from "./icon";

export const headingVariants = cva("font-serif tracking-tight text-foreground", {
  variants: {
    level: {
      h1: "text-3xl font-semibold sm:text-4xl",
      h2: "text-xl md:text-2xl",
      h3: "text-lg font-semibold leading-none",
      h4: "text-base font-semibold",
      h5: "text-sm font-semibold",
      h6: "text-xs font-semibold tracking-wide uppercase",
    },
  },
  defaultVariants: {
    level: "h2",
  },
});

export type HeadingVariants = VariantProps<typeof headingVariants>;
export type HeadingLevel = NonNullable<HeadingVariants["level"]>;

export const headingIconSizeMap: Record<HeadingLevel, IconSize> = {
  h1: "lg",
  h2: "md",
  h3: "sm",
  h4: "xs",
  h5: "xs",
  h6: "xs",
};
