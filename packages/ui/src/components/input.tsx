import * as React from "react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldVariants(), className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
