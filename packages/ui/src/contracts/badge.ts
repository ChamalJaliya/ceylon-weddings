import { cva, type VariantProps } from "class-variance-authority";

/** CVA picks the BEM class; styles/components/badge.css owns the look. */
export const badgeVariants = cva("badge", {
  variants: {
    intent: {
      default: "badge--default",
      success: "badge--success",
      warning: "badge--warning",
      danger: "badge--danger",
      info: "badge--info",
      love: "badge--love",
      premium: "badge--premium",
      outline: "badge--outline",
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type BadgeIntent = NonNullable<BadgeVariants["intent"]>;
