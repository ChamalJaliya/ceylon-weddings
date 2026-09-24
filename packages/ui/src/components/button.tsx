"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../lib/utils";
import { buttonVariants, type ButtonVariants } from "../contracts/button";
import { buttonIconSizeMap } from "../contracts/icon";
import { Icon, type IconComponent } from "./icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariants {
  asChild?: boolean;
  icon?: IconComponent;
  iconLeft?: IconComponent;
  iconRight?: IconComponent;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, shape, asChild = false, icon, iconLeft, iconRight, children, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, shape }), className);

    if (asChild) {
      return (
        <Slot data-slot="button" className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    const glyphSize = buttonIconSizeMap[size ?? "default"];
    const left = iconLeft ?? icon;

    return (
      <button data-slot="button" className={classes} ref={ref} {...props}>
        {left ? <Icon icon={left} size={glyphSize} /> : null}
        {children}
        {iconRight ? <Icon icon={iconRight} size={glyphSize} /> : null}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
