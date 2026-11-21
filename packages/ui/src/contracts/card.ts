import { cva, type VariantProps } from "class-variance-authority";

/** CVA picks the BEM class; styles/components/card.css owns the look. */
export const cardVariants = cva("card", {
  variants: {
    elevation: {
      flat: "",
      raised: "card--raised",
      interactive: "card--interactive",
      selected: "card--raised card--selected",
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
});

export type CardVariants = VariantProps<typeof cardVariants>;
export type CardElevation = NonNullable<CardVariants["elevation"]>;
