import { cva, type VariantProps } from "class-variance-authority";
import type { IconSize } from "./icon";

export const headingVariants = cva("font-serif font-medium text-foreground", {
  variants: {
    level: {
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-body-lg",
      h5: "text-body",
      h6: "cw-overline",
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
