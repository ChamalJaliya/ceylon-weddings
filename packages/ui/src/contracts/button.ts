import { cva, type VariantProps } from "class-variance-authority";

/**
 * CVA picks the BEM class; styles/components/button.css owns the look.
 * Sizes read --control-height* so density tiers resize every button.
 */
export const buttonVariants = cva("button group", {
  variants: {
    variant: {
      default: "button--primary",
      secondary: "button--secondary",
      outline: "button--outline",
      ghost: "button--ghost",
      destructive: "button--destructive",
      link: "button--link",
    },
    size: {
      default: "button--md",
      sm: "button--sm",
      lg: "button--lg",
      icon: "button--icon",
      "icon-sm": "button--icon-sm",
    },
    shape: {
      default: "",
      pill: "button--pill",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    shape: "default",
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type ButtonVariant = NonNullable<ButtonVariants["variant"]>;
export type ButtonSize = NonNullable<ButtonVariants["size"]>;
export type ButtonShape = NonNullable<ButtonVariants["shape"]>;
