import { cva, type VariantProps } from "class-variance-authority";

/** Shared surface for inputs, selects, and picker triggers (styles/components/field.css). */
export const fieldChrome = "field";

export const fieldLabel = "field-label";

export const fieldVariants = cva("field", {
  variants: {
    size: {
      default: "field--default",
      sm: "field--sm",
      multiline: "field--multiline",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export type FieldVariants = VariantProps<typeof fieldVariants>;
