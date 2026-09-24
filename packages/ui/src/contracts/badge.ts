import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      intent: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/20 text-warning-foreground",
        danger: "border-transparent bg-destructive/15 text-destructive",
        info: "border-transparent bg-info/15 text-info",
        love: "border-transparent bg-love/15 text-love",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
export type BadgeIntent = NonNullable<BadgeVariants["intent"]>;
