"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { Icon } from "./icon";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox"
    className={cn(
      "peer grid size-[1.125rem] shrink-0 place-items-center rounded-[6px] border border-border/80 bg-muted/50 shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--foreground)_5%,transparent)] transition-[border-color,box-shadow,background-color,transform] duration-200",
      "hover:border-border hover:bg-muted/80",
      "focus-visible:border-ring/70 focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_color-mix(in_oklch,var(--ring)_18%,transparent)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-none",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="grid place-items-center text-current data-[state=checked]:animate-in data-[state=checked]:zoom-in-75 data-[state=checked]:duration-150">
      <Icon icon={Check} size="xs" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export function CheckboxField({
  label,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Checkbox> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm leading-none text-foreground/90", className)}>
      <Checkbox {...props} />
      <span>{label}</span>
    </label>
  );
}
