import { cva, type VariantProps } from "class-variance-authority";

export const cardVariants = cva(
  "rounded-2xl border border-border bg-card text-card-foreground",
  {
    variants: {
      elevation: {
        flat: "shadow-none",
        raised: "shadow-card",
        interactive:
          "shadow-card transition-colors hover:border-ring/30",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      elevation: "raised",
      padding: "none",
    },
  },
);

export type CardVariants = VariantProps<typeof cardVariants>;
export type CardElevation = NonNullable<CardVariants["elevation"]>;
