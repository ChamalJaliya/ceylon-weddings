import * as React from "react";
import { cn } from "../lib/utils";
import { fieldVariants } from "../contracts/field";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      data-slot="textarea"
      className={cn(fieldVariants({ size: "multiline" }), className)}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
