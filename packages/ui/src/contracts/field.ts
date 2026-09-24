import { cva, type VariantProps } from "class-variance-authority";

/** Shared surface for inputs, selects, and picker triggers. */
export const fieldChrome =
  "appearance-none border border-border/70 bg-muted/50 text-foreground shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-[color,background-color,border-color,box-shadow] duration-200 ease-out placeholder:text-muted-foreground/65 hover:border-border hover:bg-muted/80 focus-visible:border-ring/70 focus-visible:bg-background focus-visible:shadow-[0_0_0_4px_color-mix(in_oklch,var(--ring)_18%,transparent)] focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-muted/50 aria-invalid:border-destructive/55 aria-invalid:shadow-[0_0_0_4px_color-mix(in_oklch,var(--destructive)_16%,transparent)]";

export const fieldLabel =
  "text-[13px] font-medium leading-none tracking-[0.01em] text-foreground/80";

export const fieldVariants = cva(
  [
    "flex w-full min-w-0 items-center rounded-2xl text-sm",
    fieldChrome,
  ],
  {
    variants: {
      size: {
        default: "h-11 px-3.5",
        sm: "h-9 px-3 text-[13px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export type FieldVariants = VariantProps<typeof fieldVariants>;
