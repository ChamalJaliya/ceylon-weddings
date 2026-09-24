import * as React from "react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldVariants(),
        "file:mr-3 file:inline-flex file:h-7 file:items-center file:rounded-lg file:border-0 file:bg-secondary file:px-2.5 file:text-xs file:font-medium file:text-secondary-foreground",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";
