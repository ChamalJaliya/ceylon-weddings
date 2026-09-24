import * as React from "react";
import { cn } from "../lib/utils";
import { fieldChrome } from "../contracts/field";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full resize-y rounded-2xl px-3.5 py-3 text-sm leading-relaxed",
        fieldChrome,
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
