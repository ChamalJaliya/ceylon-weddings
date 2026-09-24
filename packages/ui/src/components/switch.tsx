"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "../lib/utils";

export const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    data-slot="switch"
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted p-0.5 shadow-[inset_0_1px_2px_color-mix(in_oklch,var(--foreground)_8%,transparent)] transition-colors duration-200",
      "hover:bg-muted/80",
      "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_color-mix(in_oklch,var(--ring)_18%,transparent)]",
      "disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:shadow-none",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block size-[1.125rem] rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 ease-out",
        "data-[state=checked]:translate-x-[1.25rem] data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
